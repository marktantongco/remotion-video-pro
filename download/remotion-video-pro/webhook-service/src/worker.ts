import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { startLambdaRender } from './lib/render';
import type { RenderJobData } from './lib/queue';

const redis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

const worker = new Worker<RenderJobData>(
  'remotion-render',
  async (job) => {
    console.log(`[Job ${job.id}] Starting: ${job.data.composition}`);
    const result = await startLambdaRender(job.data);
    console.log(`[Job ${job.id}] Completed: ${result.outputUrl}`);
    return result;
  },
  {
    connection: redis,
    concurrency: CONCURRENCY,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] Failed: ${err.message}`);
});

worker.on('completed', (job) => {
  console.log(`[Job ${job.id}] Success`);
});

console.log(`Render worker started (concurrency: ${CONCURRENCY})`);
