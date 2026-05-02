import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Map Stripe events to Remotion compositions with version routing
// Format: "event.type" → "CompositionName" (defaults to latest version)
// To pin a version: "event.type:v2" → "CompositionName:v2"
const STRIPE_EVENT_MAP: Record<string, string> = {
  'checkout.session.completed': 'ThankYouVideo',
  'customer.subscription.created': 'WelcomeVideo',
  'customer.subscription.renewed': 'RenewalVideo',
  'invoice.payment_succeeded': 'ReceiptVideo',
};

// Version pinning — explicit version overrides
// When a webhook sends X-Composition-Version header, it overrides default
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
    // Custom fields from metadata
    customHeadline: session.metadata?.headline,
    customMessage: session.metadata?.message,
  };
}

function resolveComposition(eventType: string, versionHeader?: string | null): string | null {
  // Check explicit version override from header
  if (versionHeader && VERSION_OVERRIDES[eventType]?.[versionHeader]) {
    return VERSION_OVERRIDES[eventType][versionHeader];
  }

  // Check metadata-based version pinning (X-Composition-Version)
  return STRIPE_EVENT_MAP[eventType] || null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Verify Stripe webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Stripe signature verification failed: ${message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Resolve composition
  const eventType = event.type;
  const versionHeader = req.headers.get('x-composition-version');
  const composition = resolveComposition(eventType, versionHeader);

  if (!composition) {
    console.log(`Unhandled Stripe event: ${eventType}`);
    return NextResponse.json({ received: true, action: 'ignored' });
  }

  // Extract props from Stripe session data
  let props: Record<string, unknown>;
  try {
    if (eventType === 'checkout.session.completed') {
      props = extractPropsFromSession(event.data.object as unknown as StripeSession);
    } else {
      // Generic extraction for other events
      props = event.data.object as Record<string, unknown>;
    }
  } catch (err) {
    console.error(`Failed to extract props from ${eventType}:`, err);
    return NextResponse.json({ error: 'Failed to extract props' }, { status: 500 });
  }

  // Create render job
  const job = await prisma.renderJob.create({
    data: {
      composition,
      props,
      status: 'pending',
    },
  });

  // Enqueue for rendering
  await renderQueue.add('render', {
    composition,
    props,
    jobId: job.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });

  console.log(`[Stripe] ${eventType} → ${composition} (job: ${job.id})`);

  return NextResponse.json({
    received: true,
    jobId: job.id,
    composition,
    status: 'queued',
  });
}
