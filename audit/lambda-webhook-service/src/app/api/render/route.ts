import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';

const webhookSchema = z.object({
  event: z.enum(['user.created', 'order.completed', 'lead.qualified']),
  data: z.record(z.unknown()),
  signature: z.string().optional(),
});

// Map CRM events to compositions
const EVENT_MAP: Record<string, string> = {
  'user.created': 'WelcomeVideo',
  'order.completed': 'ThankYouVideo',
  'lead.qualified': 'DemoVideo',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = webhookSchema.parse(body);

    // Verify webhook secret (production guard)
    const secret = req.headers.get('x-webhook-secret');
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const composition = EVENT_MAP[parsed.event];
    if (!composition) {
      return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    }

    // Create job record
    const job = await prisma.renderJob.create({
      data: {
        composition,
        props: parsed.data,
        status: 'pending',
      },
    });

    // Enqueue render
    await renderQueue.add('render', {
      composition,
      props: parsed.data,
      jobId: job.id,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
