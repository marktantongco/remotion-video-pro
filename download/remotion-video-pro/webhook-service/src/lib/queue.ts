import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

export const renderQueue = new Queue('remotion-render', { connection: redis });

export interface RenderJobData {
  composition: string;
  props: Record<string, unknown>;
  jobId: string;
  callbackUrl?: string;
}
