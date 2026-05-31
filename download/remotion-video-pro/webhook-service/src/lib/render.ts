import {
  renderMediaOnLambda,
  getRenderProgress,
} from '@remotion/lambda';
import type { AwsRegion } from '@remotion/lambda';
import { RenderJobData } from './queue';
import { prisma } from './db';

const REGION = process.env.REMOTION_AWS_REGION! as AwsRegion;
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const SERVE_URL = process.env.REMOTION_SERVE_URL!;

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 600_000;

export async function startLambdaRender(data: RenderJobData) {
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

  const outputUrl = `https://${bucketName}.s3.amazonaws.com/${renderId}.mp4`;

  if (data.callbackUrl) {
    await fetch(data.callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: data.jobId,
        status: 'done',
        outputUrl,
        renderedAt: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error(`Callback failed for job ${data.jobId}:`, err);
    });
  }

  return { renderId, outputUrl };
}
