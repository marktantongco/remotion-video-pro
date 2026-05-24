import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';
import { verifyCheckoutHmac } from '@/lib/hmac';
import { rateLimitResponse, getClientIp } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Map Stripe events to Remotion compositions
const STRIPE_EVENT_MAP: Record<string, string> = {
  'checkout.session.completed': 'ThankYouVideo',
  'customer.subscription.created': 'WelcomeVideo',
  'customer.subscription.renewed': 'RenewalVideo',
  'invoice.payment_succeeded': 'ReceiptVideo',
};

// Explicit version pinning via X-Composition-Version header
const VERSION_OVERRIDES: Record<string, Record<string, string>> = {
  'checkout.session.completed': {
    '1': 'ThankYouVideo:v1',
    '2': 'ThankYouVideo:v2',
  },
};

interface StripeSession {
  id: string;
  customer_email?: string | null;
  customer_details?: {
    name?: string | null;
    email?: string | null;
  } | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string> | null;
  line_items?: {
    data: Array<{
      description?: string | null;
      amount_total?: number | null;
      price?: {
        product?: string | null;
      } | null;
    }>;
  } | null;
  created?: number;
}

function extractPropsFromSession(session: StripeSession): Record<string, unknown> {
  const customerName =
    session.customer_details?.name ||
    session.metadata?.customer_name ||
    'Valued Customer';

  const email =
    session.customer_details?.email ||
    session.customer_email ||
    '';

  const productNames = (session.line_items?.data || [])
    .map((item) => item.description || 'Product')
    .join(', ');

  const amount = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : '0.00';

  const currency = session.currency?.toUpperCase() || 'USD';

  const purchaseDate = session.created
    ? new Date(session.created * 1000).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    customerName,
    email,
    productName: productNames,
    amount,
    currency,
    purchaseDate,
    brandColor: session.metadata?.brand_color || '#ff0055',
    orderId: session.id,
    customHeadline: session.metadata?.headline,
    customMessage: session.metadata?.message,
  };
}

function resolveComposition(eventType: string, versionHeader?: string | null): string | null {
  if (versionHeader && VERSION_OVERRIDES[eventType]?.[versionHeader]) {
    return VERSION_OVERRIDES[eventType][versionHeader];
  }
  return STRIPE_EVENT_MAP[eventType] || null;
}

/**
 * Check if there's an active A/B test for a composition.
 * If so, randomly assign a variant and resolve the version.
 *
 * @param composition - Base composition name (e.g., "ThankYouVideo")
 * @returns A/B test assignment or null
 */
async function getABTestAssignment(
  composition: string
): Promise<{ abTestId: string; variant: 'control' | 'treatment'; version: string; metadataKey: string } | null> {
  const activeTest = await prisma.aBTest.findFirst({
    where: { composition, isActive: true },
  });

  if (!activeTest) return null;

  // 50/50 random assignment
  const variant = Math.random() < 0.5 ? 'control' as const : 'treatment' as const;
  const version = variant === 'control'
    ? activeTest.controlVersion
    : activeTest.treatmentVersion;

  return {
    abTestId: activeTest.id,
    variant,
    version,
    metadataKey: activeTest.stripeMetadataKey,
  };
}

export async function POST(req: NextRequest) {
  // VULN-4: Rate limiting (higher limit for Stripe retries)
  const rl = rateLimit(getClientIp(req), '/api/stripe-webhook', 'POST');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // ── Layer 1: Verify Stripe webhook signature ──
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe] Signature verification failed: ${message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Resolve composition
  const eventType = event.type;
  const versionHeader = req.headers.get('x-composition-version');
  let composition = resolveComposition(eventType, versionHeader);

  if (!composition) {
    console.log(`[Stripe] Unhandled event: ${eventType}`);
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  // Extract props from Stripe session data
  let props: Record<string, unknown>;
  let session: StripeSession | null = null;

  try {
    if (eventType === 'checkout.session.completed') {
      session = event.data.object as unknown as StripeSession;

      // ── Layer 2: Per-checkout HMAC verification ──
      const renderHmac = session.metadata?.render_hmac;
      if (!verifyCheckoutHmac(session.id, renderHmac)) {
        console.error(`[Stripe] HMAC verification failed for session ${session.id}`);
        return NextResponse.json(
          { error: 'HMAC verification failed — unauthorized checkout' },
          { status: 403 }
        );
      }

      props = extractPropsFromSession(session);
    } else {
      props = event.data.object as Record<string, unknown>;
    }
  } catch (err) {
    console.error(`[Stripe] Failed to extract props from ${eventType}:`, err);
    return NextResponse.json({ error: 'Failed to extract props' }, { status: 500 });
  }

  // ── A/B Test Integration ──
  let abTestId: string | undefined;
  let abVariant: string | undefined;
  let videoVersion: string | undefined;
  let resolvedComposition = composition;

  const abAssignment = await getABTestAssignment(composition);
  if (abAssignment) {
    abTestId = abAssignment.abTestId;
    abVariant = abAssignment.variant;
    videoVersion = abAssignment.version;
    resolvedComposition = `${composition}:${abAssignment.version}`;

    // Add variant info to Stripe metadata
    if (session) {
      try {
        await stripe.checkout.sessions.update(session.id, {
          metadata: {
            ...session.metadata,
            [abAssignment.metadataKey]: abAssignment.variant,
          },
        });
      } catch (err) {
        console.warn(`[Stripe] Failed to update session metadata with variant:`, err);
      }
    }

    console.log(`[A/B Test] Assigned variant "${abVariant}" for test ${abTestId} (version: ${videoVersion})`);
  }

  // Create render job with A/B test fields
  const job = await prisma.renderJob.create({
    data: {
      composition,
      version: videoVersion || undefined,
      props: props as any,
      status: 'pending',
      abTestId,
      abVariant,
      videoVersion,
      stripeMetadata: session?.metadata || null,
    },
  });

  // Create analytics record
  await prisma.renderAnalytics.create({
    data: {
      jobId: job.id,
      abTestId,
      variant: abVariant,
      composition,
      version: videoVersion || 'default',
    },
  });

  // Enqueue for rendering
  await renderQueue.add('render', {
    composition: resolvedComposition,
    props,
    jobId: job.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });

  console.log(`[Stripe] ${eventType} → ${resolvedComposition} (job: ${job.id}, variant: ${abVariant || 'none'})`);

  return NextResponse.json({
    received: true,
    jobId: job.id,
    composition: resolvedComposition,
    abTestId,
    abVariant,
    status: 'queued',
  });
}
