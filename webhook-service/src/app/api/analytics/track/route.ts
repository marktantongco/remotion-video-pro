import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimitResponse, getClientIp } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/analytics/track — Track analytics events for rendered videos.
 *
 * Called by external systems (email trackers, video players, conversion pixels)
 * when a user opens an email, plays a video, or converts.
 *
 * Authentication: Requires `x-analytics-token` header matching ANALYTICS_TOKEN env var.
 * This is a lightweight auth mechanism since these calls come from client-side systems
 * (not from trusted servers).
 *
 * Body: { jobId, event: "email_opened" | "video_played" | "converted", ltv?: number }
 */

const trackSchema = z.object({
  jobId: z.string().min(1),
  event: z.enum(['email_opened', 'video_played', 'converted']),
  ltv: z.number().optional().nullable(),
});

export async function POST(req: NextRequest) {
  // Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/analytics/track', 'POST');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // Analytics token auth (lightweight — not admin-level)
  const analyticsToken = req.headers.get('x-analytics-token');
  if (!analyticsToken || analyticsToken !== process.env.ANALYTICS_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid or missing analytics token' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { jobId, event, ltv } = parsed.data;

  // Verify the job exists
  const job = await prisma.renderJob.findUnique({
    where: { id: jobId },
    include: { analytics: true },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Find or create analytics record
  let analytics = job.analytics[0];
  if (!analytics) {
    analytics = await prisma.renderAnalytics.create({
      data: {
        jobId,
        abTestId: job.abTestId,
        variant: job.abVariant,
        composition: job.composition,
        version: job.version || 'default',
      },
    });
  }

  // Update the specific event field
  const updateData: Record<string, unknown> = {};

  switch (event) {
    case 'email_opened':
      updateData.deliveryOpen = true;
      break;
    case 'video_played':
      updateData.videoPlayed = true;
      break;
    case 'converted':
      updateData.conversion = true;
      if (ltv !== undefined && ltv !== null) {
        updateData.ltv = ltv;
        // Mark job as LTV tracked
        await prisma.renderJob.update({
          where: { id: jobId },
          data: { ltvTracked: true },
        });
      }
      break;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.renderAnalytics.update({
      where: { id: analytics.id },
      data: updateData,
    });
  }

  console.log(`[Analytics] ${event} tracked for job ${jobId} (variant: ${job.abVariant || 'none'})`);

  return NextResponse.json({
    success: true,
    jobId,
    event,
    tracked: true,
  });
}
