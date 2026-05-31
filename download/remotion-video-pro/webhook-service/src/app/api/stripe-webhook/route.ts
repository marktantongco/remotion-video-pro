import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';
import { verifyCheckoutHmac } from '@/lib/hmac';

// ── A/B Test Assignment ──

/**
 * Check for an active A/B test on the given composition.
 * If found, randomly assigns a variant (50/50) and returns the test info.
 */
async function getABTestAssignment(composition: string): Promise<{
  abTestId: string | null;
  abVariant: 'control' | 'treatment' | null;
  videoVersion: string | null;
}> {
  const activeTest = await prisma.aBTest.findFirst({
    where: { composition, isActive: true },
  });

  if (!activeTest) {
    return { abTestId: null, abVariant: null, videoVersion: null };
  }

  // 50/50 random assignment using crypto-safe randomness
  const byte = randomBytes(1)[0];
  const variant: 'control' | 'treatment' = byte < 128 ? 'control' : 'treatment';
  const videoVersion = variant === 'control'
    ? activeTest.controlVersion
    : activeTest.treatmentVersion;

  console.log(`[A/B] Test "${activeTest.name}" — assigned ${variant} (version: ${videoVersion})`);

  return {
    abTestId: activeTest.id,
    abVariant: variant,
    videoVersion,
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // ── Layer 1: Verify Stripe webhook signature ──
  // Confirms the payload came from Stripe, not from a random HTTP client.
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
  const composition = resolveComposition(eventType, versionHeader);

  if (!composition) {
    console.log(`[Stripe] Unhandled event: ${eventType}`);
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  // Extract props from Stripe session data
  let props: Record<string, unknown>;
  try {
    if (eventType === 'checkout.session.completed') {
      const session = event.data.object as unknown as StripeSession;

      // ── Layer 2: Per-checkout HMAC verification ──
      // Confirms this checkout was initiated by our server (not replayed or forged).
      // HMAC is generated server-side when creating the Stripe checkout session
      // and stored in session metadata as "render_hmac".
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

  // Check for A/B test on this composition
  const { abTestId, abVariant, videoVersion } = await getABTestAssignment(composition);
  const renderVersion = videoVersion || 'default';

  // Create render job with A/B test fields
  const job = await prisma.renderJob.create({
    data: {
      composition,
      version: renderVersion,
      props,
      status: 'pending',
      abTestId: abTestId ?? undefined,
      abVariant: abVariant ?? undefined,
      videoVersion: videoVersion ?? undefined,
      stripeMetadata: eventType === 'checkout.session.completed'
        ? ((event.data.object as unknown as StripeSession).metadata as Record<string, unknown>) ?? undefined
        : undefined,
    },
  });

  // Create analytics record for A/B test tracking
  if (abTestId && abVariant) {
    await prisma.renderAnalytics.create({
      data: {
        renderJobId: job.id,
        abTestId,
        abVariant,
        videoVersion,
      },
    });
    console.log(`[Stripe] ${eventType} → ${composition} (job: ${job.id}, A/B: ${abVariant})`);
  } else {
    console.log(`[Stripe] ${eventType} → ${composition} (job: ${job.id})`);
  }

  // Enqueue for rendering
  await renderQueue.add('render', {
    composition: renderVersion === 'default' ? composition : `${composition}:${renderVersion}`,
    props,
    jobId: job.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });

  return NextResponse.json({
    received: true,
    jobId: job.id,
    composition,
    version: renderVersion,
    abTestId: abTestId ?? undefined,
    abVariant: abVariant ?? undefined,
    status: 'queued',
  });
}
