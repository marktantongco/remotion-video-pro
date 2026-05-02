# Batch Rendering at Scale

## Concept

Treat personalized video as a bulk ETL job. Instead of triggering one render per webhook event, accept a batch of records and fan out to Lambda concurrency. This turns 10,000 personalized videos into a single API call.

## Batch API Endpoint

Add to your existing webhook service:

```ts
// src/app/api/render/batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';

const batchSchema = z.object({
  composition: z.string().min(1),
  records: z.array(z.object({
    id: z.string(),
    props: z.record(z.unknown()),
  })).min(1).max(10000), // Hard limit per batch
  callbackUrl: z.string().url().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

const PRIORITY_DELAYS: Record<string, number> = {
  low: 60000,    // 1 minute delay for low priority
  normal: 0,
  high: 0,       // Immediate for high priority
};

export async function POST(req: NextRequest) {
  // 1. Auth check
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate batch payload
  const body = await req.json();
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid batch payload', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { composition, records, callbackUrl, priority } = parsed.data;

  // 3. Create all job records in a transaction
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

  // 4. Enqueue all jobs to BullMQ
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
          jobId: `batch-${records[index].id}`, // Dedup: same record ID skips
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
    batchJobIds: jobs.map((j) => j.id),
  });
}

export async function GET(req: NextRequest) {
  const batchId = req.nextUrl.searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
  }

  // Return aggregate status for all jobs in this batch
  const jobs = await prisma.renderJob.findMany({
    where: { id: { startsWith: batchId } },
    orderBy: { createdAt: 'asc' },
  });

  const summary = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    rendering: jobs.filter((j) => j.status === 'rendering').length,
    done: jobs.filter((j) => j.status === 'done').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    avgProgress: jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length,
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      progress: j.progress,
      outputUrl: j.outputUrl,
      error: j.error,
    })),
  };

  return NextResponse.json(summary);
}
```

## Batch Usage

```bash
# Submit a batch of 100 personalized videos
curl -X POST https://your-service.com/api/render/batch \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{
    "composition": "ThankYouVideo",
    "priority": "normal",
    "callbackUrl": "https://your-crm.com/api/video-delivery",
    "records": [
      { "id": "order-001", "props": { "customerName": "Alice", "productName": "Pro Plan" } },
      { "id": "order-002", "props": { "customerName": "Bob", "productName": "Basic Plan" } },
      { "id": "order-003", "props": { "customerName": "Carol", "productName": "Enterprise" } }
    ]
  }'
```

Check batch progress:

```bash
curl "https://your-service.com/api/render/batch?batchId=order-"
```

## Priority Queue Strategy

Three priority levels control when jobs start processing:

| Priority | Delay | Use Case |
|----------|-------|----------|
| `high` | 0ms (immediate) | Time-sensitive: welcome videos, purchase confirmations |
| `normal` | 0ms (immediate) | Standard: monthly reports, engagement videos |
| `low` | 60s (1 minute delay) | Bulk: end-of-month campaigns, retrospective videos |

Low priority jobs wait 60 seconds before becoming available to workers. This prevents bulk jobs from starving high-priority real-time renders.

## Concurrency Configuration

Match worker concurrency to your Lambda budget:

```ts
// worker.ts — adjust concurrency based on priority
const highPriorityWorker = new Worker('render', handler, {
  connection: redis,
  concurrency: 3,
});

const normalPriorityWorker = new Worker('render', handler, {
  connection: redis,
  concurrency: 2,
});
```

Alternatively, use a single worker and let BullMQ handle priority ordering:

```ts
const worker = new Worker('render', handler, {
  connection: redis,
  concurrency: 5,
  limiter: {
    max: 10,        // Max 10 jobs per duration
    duration: 1000,  // Per second
  },
});
```

## Cost Control

For large batches, cost can escalate fast. Use these guards:

```ts
// In the batch endpoint, before enqueueing:
const ESTIMATED_COST_PER_VIDEO = 0.08; // $0.08 per 30s video at 1080p
const totalEstimate = records.length * ESTIMATED_COST_PER_VIDEO;
const COST_LIMIT = 500; // $500 max per batch

if (totalEstimate > COST_LIMIT) {
  return NextResponse.json({
    error: `Estimated cost $${totalEstimate.toFixed(2)} exceeds batch limit of $${COST_LIMIT}`,
    estimatedCost: totalEstimate,
    recordCount: records.length,
  }, { status: 402 });
}
```

## Webhook Callback Pattern

When each render completes, notify the source system:

```ts
// In worker, after successful render:
if (job.data.callbackUrl) {
  await fetch(job.data.callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: job.data.jobId,
      status: 'done',
      outputUrl: result.outputUrl,
      renderedAt: new Date().toISOString(),
    }),
  }).catch((err) => {
    console.error(`Callback failed for job ${job.data.jobId}:`, err);
  });
}
```

## Deduplication

BullMQ's `jobId` option prevents duplicate renders. Use the source record's ID as the job ID:

```ts
await renderQueue.add('render', data, {
  jobId: `batch-${record.id}`, // If this ID already exists, BullMQ skips it
});
```

This means re-sending the same batch is safe — already-completed jobs are not re-rendered.
