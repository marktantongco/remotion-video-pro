/**
 * @route POST /api/analytics/track
 * @description Event tracking for A/B test analytics.
 *
 * Tracks events (email_opened, video_played, converted) for rendered videos.
 * Each event is associated with a render job and optionally an A/B test.
 * Authenticated via x-analytics-token header.
 *
 * Creates a RenderAnalytics record on the first event for a render job.
 * Subsequent events increment the appropriate counter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { timingSafeEqualStr } from '@/lib/security';

// ── Validation ──

const trackEventSchema = z.object({
  renderJobId: z.string().min(1),
  event: z.enum(['email_opened', 'video_played', 'converted']),
  ltv: z.number().optional().default(0),
  metadata: z.record(z.unknown()).optional(),
});

// ── POST: Track Event ──

export async function POST(req: NextRequest) {
  // Auth via analytics token (separate from admin/webhook secrets)
  const token = req.headers.get('x-analytics-token');
  const expectedToken = process.env.ANALYTICS_TOKEN;

  if (!token || !expectedToken || !timingSafeEqualStr(token, expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = trackEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { renderJobId, event, ltv, metadata } = parsed.data;

  // Find the render job to get A/B test info
  const job = await prisma.renderJob.findUnique({
    where: { id: renderJobId },
  });

  if (!job) {
    return NextResponse.json({ error: 'Render job not found' }, { status: 404 });
  }

  // Upsert analytics record
  const existing = await prisma.renderAnalytics.findUnique({
    where: { renderJobId },
  });

  const today = new Date().toISOString().split('T')[0];

  if (existing) {
    // Update existing analytics record
    const updateData: Record<string, unknown> = {};

    switch (event) {
      case 'email_opened':
        updateData.emailOpens = { increment: 1 };
        break;
      case 'video_played':
        updateData.videoPlays = { increment: 1 };
        break;
      case 'converted':
        updateData.conversions = { increment: 1 };
        break;
    }

    if (ltv > 0) {
      updateData.ltv = { increment: ltv };
    }

    // Update daily breakdown
    const dailyBreakdown = (existing.dailyBreakdown as Record<string, Record<string, number>>) || {};
    if (!dailyBreakdown[today]) {
      dailyBreakdown[today] = { emailOpens: 0, videoPlays: 0, conversions: 0 };
    }
    const dayData = dailyBreakdown[today];
    if (event === 'email_opened') dayData.emailOpens = (dayData.emailOpens || 0) + 1;
    if (event === 'video_played') dayData.videoPlays = (dayData.videoPlays || 0) + 1;
    if (event === 'converted') dayData.conversions = (dayData.conversions || 0) + 1;
    updateData.dailyBreakdown = dailyBreakdown;

    await prisma.renderAnalytics.update({
      where: { renderJobId },
      data: updateData,
    });
  } else {
    // Create new analytics record
    const dailyBreakdown: Record<string, Record<string, number>> = {
      [today]: { emailOpens: 0, videoPlays: 0, conversions: 0 },
    };

    if (event === 'email_opened') dailyBreakdown[today].emailOpens = 1;
    if (event === 'video_played') dailyBreakdown[today].videoPlays = 1;
    if (event === 'converted') dailyBreakdown[today].conversions = 1;

    await prisma.renderAnalytics.create({
      data: {
        renderJobId,
        abTestId: job.abTestId,
        abVariant: job.abVariant,
        videoVersion: job.videoVersion,
        emailOpens: event === 'email_opened' ? 1 : 0,
        videoPlays: event === 'video_played' ? 1 : 0,
        conversions: event === 'converted' ? 1 : 0,
        ltv,
        dailyBreakdown,
      },
    });
  }

  return NextResponse.json({
    success: true,
    event,
    renderJobId,
    abTestId: job.abTestId,
    abVariant: job.abVariant,
  });
}
