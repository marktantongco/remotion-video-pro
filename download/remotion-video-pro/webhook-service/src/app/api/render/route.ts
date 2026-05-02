import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';

const webhookSchema = z.object({
  event: z.string().min(1).max(100),
  data: z.record(z.unknown()).refine(
    (d) => Object.keys(d).length > 0,
    { message: 'Webhook data must not be empty' }
  ),
});

const EVENT_MAP: Record<string, string> = {
  'user.created': 'WelcomeVideo',
  'order.completed': 'ThankYouVideo',
  'lead.qualified': 'DemoVideo',
  'milestone.reached': 'AchievementVideo',
  'subscription.renewed': 'RenewalVideo',
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const composition = EVENT_MAP[parsed.data.event];
  if (!composition) {
    return NextResponse.json({ error: `Unknown event: ${parsed.data.event}` }, { status: 400 });
  }

  const job = await prisma.renderJob.create({
    data: {
      composition,
      props: parsed.data.data,
      status: 'pending',
    },
  });

  await renderQueue.add('render', {
    composition,
    props: parsed.data.data,
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
