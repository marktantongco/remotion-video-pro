import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  withAdmin,
  adminUnauthorizedResponse,
  rateLimitResponse,
  getClientIp,
} from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/ab/[id] — Get detailed A/B test results with statistical significance.
 *
 * Returns:
 * - Test configuration
 * - Per-variant stats (count, conversion rate, avg LTV)
 * - Statistical significance (chi-square test)
 * - Daily breakdown
 */

/**
 * Simple chi-square test for two proportions.
 * Tests whether the conversion rates between control and treatment are significantly different.
 *
 * @param controlConversions - Number of conversions in control group
 * @param controlTotal - Total observations in control group
 * @param treatmentConversions - Number of conversions in treatment group
 * @param treatmentTotal - Total observations in treatment group
 * @returns Chi-square statistic and whether result is significant at p=0.05
 */
function chiSquareTest(
  controlConversions: number,
  controlTotal: number,
  treatmentConversions: number,
  treatmentTotal: number
): { chiSquare: number; pValue: number; significant: boolean } {
  // Contingency table:
  //              Converted  Not Converted  Total
  // Control         a            b           controlTotal
  // Treatment       c            d           treatmentTotal
  const a = controlConversions;
  const b = controlTotal - controlConversions;
  const c = treatmentConversions;
  const d = treatmentTotal - treatmentConversions;

  const n = a + b + c + d;

  if (n === 0) {
    return { chiSquare: 0, pValue: 1, significant: false };
  }

  // Expected values under null hypothesis
  const eConverted = ((a + c) * (a + b)) / n;
  const eNotConverted = ((b + d) * (a + b)) / n;
  const eTreatmentConverted = ((a + c) * (c + d)) / n;
  const eTreatmentNotConverted = ((b + d) * (c + d)) / n;

  // Chi-square calculation with Yates' correction for continuity
  const calcComponent = (observed: number, expected: number) => {
    if (expected === 0) return 0;
    const diff = Math.abs(observed - expected) - 0.5;
    return (diff * diff) / expected;
  };

  const chiSquare =
    calcComponent(a, eConverted) +
    calcComponent(b, eNotConverted) +
    calcComponent(c, eTreatmentConverted) +
    calcComponent(d, eTreatmentNotConverted);

  // Approximate p-value from chi-square distribution (df=1)
  // Using the approximation: p ≈ e^(-0.5 * chiSquare)
  const pValue = Math.exp(-0.5 * chiSquare);
  const significant = chiSquare > 3.841; // Critical value for df=1, alpha=0.05

  return {
    chiSquare: Math.round(chiSquare * 1000) / 1000,
    pValue: Math.round(pValue * 1000) / 1000,
    significant,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = rateLimit(getClientIp(req), '/api/ab/[id]', 'GET');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const { id } = await params;

  const test = await prisma.aBTest.findUnique({
    where: { id },
  });

  if (!test) {
    return NextResponse.json({ error: 'A/B test not found' }, { status: 404 });
  }

  // Get all jobs for this test with analytics
  const allJobs = await prisma.renderJob.findMany({
    where: { abTestId: id },
    include: { analytics: true },
    orderBy: { createdAt: 'asc' },
  });

  const controlJobs = allJobs.filter((j) => j.abVariant === 'control');
  const treatmentJobs = allJobs.filter((j) => j.abVariant === 'treatment');

  // Per-variant detailed stats
  const calcDetailedStats = (jobs: typeof allJobs) => {
    const total = jobs.length;
    const completed = jobs.filter((j) => j.status === 'done').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const pending = jobs.filter((j) => j.status === 'pending').length;

    const emailOpens = jobs.filter((j) =>
      j.analytics.some((a) => a.deliveryOpen === true)
    ).length;
    const videoPlays = jobs.filter((j) =>
      j.analytics.some((a) => a.videoPlayed === true)
    ).length;
    const conversions = jobs.filter((j) =>
      j.analytics.some((a) => a.conversion === true)
    ).length;

    const ltvValues = jobs
      .flatMap((j) => j.analytics.map((a) => a.ltv))
      .filter((v): v is number => v !== null && v !== undefined);
    const avgLtv = ltvValues.length > 0
      ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length
      : null;
    const totalLtv = ltvValues.reduce((a, b) => a + b, 0);

    return {
      total,
      completed,
      failed,
      pending,
      emailOpens,
      emailOpenRate: total > 0 ? emailOpens / total : 0,
      videoPlays,
      videoPlayRate: total > 0 ? videoPlays / total : 0,
      conversions,
      conversionRate: total > 0 ? conversions / total : 0,
      avgLtv: avgLtv !== null ? Math.round(avgLtv * 100) / 100 : null,
      totalLtv: Math.round(totalLtv * 100) / 100,
    };
  };

  const controlStats = calcDetailedStats(controlJobs);
  const treatmentStats = calcDetailedStats(treatmentJobs);

  // Statistical significance
  const significance = chiSquareTest(
    controlStats.conversions,
    controlStats.total,
    treatmentStats.conversions,
    treatmentStats.total
  );

  // Daily breakdown (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentJobs = allJobs.filter((j) => j.createdAt >= thirtyDaysAgo);

  const dailyBreakdown: Record<string, { control: number; treatment: number; conversions: number }> = {};
  for (const job of recentJobs) {
    const day = job.createdAt.toISOString().split('T')[0];
    if (!dailyBreakdown[day]) {
      dailyBreakdown[day] = { control: 0, treatment: 0, conversions: 0 };
    }
    if (job.abVariant === 'control') dailyBreakdown[day].control++;
    if (job.abVariant === 'treatment') dailyBreakdown[day].treatment++;
    if (job.analytics.some((a) => a.conversion === true)) {
      dailyBreakdown[day].conversions++;
    }
  }

  return NextResponse.json({
    test,
    stats: {
      control: controlStats,
      treatment: treatmentStats,
      totalJobs: allJobs.length,
    },
    significance,
    dailyBreakdown,
  });
}

/**
 * DELETE /api/ab/[id] — End an A/B test (set isActive=false).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = rateLimit(getClientIp(req), '/api/ab/[id]', 'DELETE');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const { id } = await params;

  const test = await prisma.aBTest.findUnique({ where: { id } });
  if (!test) {
    return NextResponse.json({ error: 'A/B test not found' }, { status: 404 });
  }

  if (!test.isActive) {
    return NextResponse.json(
      { error: 'A/B test is already ended', test },
      { status: 400 }
    );
  }

  const updated = await prisma.aBTest.update({
    where: { id },
    data: { isActive: false, endedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    test: updated,
    message: `A/B test "${updated.name}" ended. Control version "${updated.controlVersion}" remains active.`,
  });
}
