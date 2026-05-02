# Webhook Integration — Data-Driven Video

## Architecture

The core concept: video is a database row. When data changes in your CRM, database, or any external system, a webhook triggers a render pipeline that produces a personalized video.

```
External System (CRM/Stripe/etc.)
    |
    v
POST /api/render (Next.js API)
    |
    v
Prisma DB (job record created)
    |
    v
BullMQ Queue (Redis-backed)
    |
    v
Worker Process (polls Lambda)
    |
    v
Remotion Lambda (renders on cloud)
    |
    v
S3 (output video URL)
```

## Webhook Service Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- AWS account with Lambda access
- Remotion project deployed to S3

### Database Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model RenderJob {
  id          String   @id @default(cuid())
  composition String
  props       Json
  status      String   @default("pending")
  progress    Float    @default(0)
  outputUrl   String?
  error       String?
  webhookUrl  String?  // Optional: callback URL when render completes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

### Event Mapping

Map external events to Remotion compositions:

```ts
const EVENT_MAP: Record<string, string> = {
  'user.created': 'WelcomeVideo',
  'order.completed': 'ThankYouVideo',
  'lead.qualified': 'DemoVideo',
  'milestone.reached': 'AchievementVideo',
  'subscription.renewed': 'RenewalVideo',
};
```

### Webhook API Endpoint

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';

const webhookSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  // 1. Verify webhook secret
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate payload
  const body = await req.json();
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error }, { status: 400 });
  }

  // 3. Map event to composition
  const composition = EVENT_MAP[parsed.data.event];
  if (!composition) {
    return NextResponse.json({ error: `Unknown event: ${parsed.data.event}` }, { status: 400 });
  }

  // 4. Create job record
  const job = await prisma.renderJob.create({
    data: {
      composition,
      props: parsed.data.data,
      status: 'pending',
    },
  });

  // 5. Enqueue render job
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
```

### Render Worker

```ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { startLambdaRender } from './lib/render';

const redis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

const worker = new Worker(
  'remotion-render',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.data.composition}`);
    const result = await startLambdaRender(job.data);
    console.log(`Completed: ${result.outputUrl}`);

    // Optional: send webhook callback
    if (job.data.callbackUrl) {
      await fetch(job.data.callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.data.jobId,
          status: 'done',
          outputUrl: result.outputUrl,
        }),
      });
    }

    return result;
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

console.log('Render worker started with concurrency: 5');
```

### Lambda Render Function

```ts
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda';
import { prisma } from './db';

const REGION = process.env.REMOTION_AWS_REGION!;
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const SERVE_URL = process.env.REMOTION_SERVE_URL!;

const POLL_INTERVAL_MS = 2000; // Check progress every 2 seconds
const MAX_POLL_DURATION_MS = 600_000; // 10 minute timeout

export async function startLambdaRender(data: {
  composition: string;
  props: Record<string, unknown>;
  jobId: string;
}) {
  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl: SERVE_URL,
    composition: data.composition,
    inputProps: data.props,
    codec: 'h264',
    imageFormat: 'jpeg',
    maxRetries: 1,
    privacy: 'public',
  });

  // Poll until done or timeout
  const startTime = Date.now();
  let progress = 0;

  while (progress < 1) {
    if (Date.now() - startTime > MAX_POLL_DURATION_MS) {
      await prisma.renderJob.update({
        where: { id: data.jobId },
        data: { status: 'failed', error: 'Render timeout (10 minutes)' },
      });
      throw new Error('Render timeout');
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const status = await getRenderProgress({
      renderId,
      bucketName,
      functionName: FUNCTION_NAME,
      region: REGION,
    });

    progress = status.overallProgress;

    await prisma.renderJob.update({
      where: { id: data.jobId },
      data: {
        status: status.done ? 'done' : 'rendering',
        progress,
        outputUrl: status.outputFile || null,
        error: status.fatalErrorEncountered ? 'Render failed on Lambda' : null,
      },
    });

    if (status.fatalErrorEncountered) {
      throw new Error(`Lambda render failed: ${JSON.stringify(status.fatalErrorEncountered)}`);
    }
  }

  return {
    renderId,
    outputUrl: `https://${bucketName}.s3.amazonaws.com/${renderId}.mp4`,
  };
}
```

## Wiring External Services

### Stripe Checkout

```bash
# In Stripe dashboard, set webhook endpoint to:
https://your-service.com/api/render

# Stripe sends:
{
  "event": "order.completed",
  "data": {
    "customerName": "Alice",
    "productName": "Pro Plan",
    "purchaseDate": "2026-05-03"
  }
}
```

### Custom CRM Webhook

```bash
curl -X POST https://your-service.com/api/render \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret-here" \
  -d '{
    "event": "lead.qualified",
    "data": {
      "leadName": "Bob Smith",
      "company": "Acme Corp",
      "score": 92
    }
  }'
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/remotion
REDIS_URL=redis://localhost:6379
REMOTION_AWS_ACCESS_KEY_ID=your_key
REMOTION_AWS_SECRET_ACCESS_KEY=your_secret
REMOTION_AWS_REGION=us-east-1
REMOTION_SERVE_URL=https://your-site.s3.amazonaws.com/index.html
REMOTION_FUNCTION_NAME=remotion-render-fn
WEBHOOK_SECRET=your-webhook-secret
```
