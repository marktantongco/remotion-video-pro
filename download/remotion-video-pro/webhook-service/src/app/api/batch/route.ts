import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';

const batchSchema = z.object({
  composition: z.string().min(1),
  records: z
    .array(
      z.object({
        id: z.string(),
        props: z.record(z.unknown()),
      })
    )
    .min(1)
    .max(10000),
  callbackUrl: z.string().url().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

const PRIORITY_DELAYS: Record<string, number> = {
  low: 60000,
  normal: 0,
  high: 0,
};

const ESTIMATED_COST_PER_VIDEO = 0.08;
const COST_LIMIT_PER_BATCH = 500;

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid batch payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { composition, records, callbackUrl, priority } = parsed.data;

  const totalEstimate = records.length * ESTIMATED_COST_PER_VIDEO;
  if (totalEstimate > COST_LIMIT_PER_BATCH) {
    return NextResponse.json(
      {
        error: `Estimated cost $${totalEstimate.toFixed(2)} exceeds batch limit of $${COST_LIMIT_PER_BATCH}`,
        estimatedCost: totalEstimate,
        recordCount: records.length,
      },
      { status: 402 }
    );
  }

  const jobs = await prisma.$transaction(
    records.map((record) =>
      prisma.renderJob.create({
        data: {
          composition,
          props: record.props,
          status: 'pending',
          webhookUrl: callbackUrl,
        },
      })
    )
  );

  const enqueueResults = await Promise.allSettled(
    jobs.map((job, index) =>
      renderQueue.add(
        'render',
        {
          composition,
          props: records[index].props,
          jobId: job.id,
          callbackUrl,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          delay: PRIORITY_DELAYS[priority],
          jobId: `batch-${records[index].id}`,
        }
      )
    )
  );

  const failed = enqueueResults.filter((r) => r.status === 'rejected').length;
  const queued = enqueueResults.length - failed;

  return NextResponse.json({
    success: true,
    totalRecords: records.length,
    queued,
    failed,
    estimatedCost: totalEstimate,
    batchJobIds: jobs.map((j) => j.id),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const composition = searchParams.get('composition');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const where: Record<string, unknown> = {};
  if (composition) where.composition = composition;
  if (status) where.status = status;

  const jobs = await prisma.renderJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 1000),
  });

  const summary = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    rendering: jobs.filter((j) => j.status === 'rendering').length,
    done: jobs.filter((j) => j.status === 'done').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    avgProgress: jobs.length > 0 ? jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length : 0,
    jobs: jobs.map((j) => ({
      id: j.id,
      composition: j.composition,
      status: j.status,
      progress: j.progress,
      outputUrl: j.outputUrl,
      error: j.error,
      createdAt: j.createdAt,
    })),
  };

  return NextResponse.json(summary);
}
