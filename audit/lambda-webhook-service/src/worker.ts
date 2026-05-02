import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { startLambdaRender } from './lib/render';
import { RenderJobData } from './lib/queue';

const redis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

const worker = new Worker<RenderJobData>(
  'remotion-render',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.data.composition}`);
    const result = await startLambdaRender(job.data);
    console.log(`Completed: ${result.outputUrl}`);
    return result;
  },
  { connection: redis, concurrency: 5 }
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Render worker started');
