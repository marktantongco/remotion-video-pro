import {
  renderMediaOnLambda,
  getRenderProgress,
} from '@remotion/lambda';
import { RenderJobData } from './queue';
import { prisma } from './db';

const REGION = process.env.REMOTION_AWS_REGION!;
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME!;
const SERVE_URL = process.env.REMOTION_SERVE_URL!;

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

  // Poll progress
  let progress = 0;
  while (progress < 1) {
    await new Promise((r) => setTimeout(r, 1000));
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
        error: status.fatalErrorEncountered ? 'Render failed' : null,
      },
    });

    if (status.fatalErrorEncountered) {
      throw new Error('Render failed');
    }
  }

  return { renderId, outputUrl: `https://${bucketName}.s3.amazonaws.com/${renderId}` };
}
