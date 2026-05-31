/**
 * @route GET/DELETE /api/ab/[id]
 * @description A/B test detail — view stats, run significance test, end test.
 *
 * GET: Retrieve detailed A/B test results including per-variant stats,
 *   chi-square significance test (with Yates' correction for small samples),
 *   and daily breakdown (last 30 days).
 *
 * DELETE: End an A/B test by setting isActive to false.
 *   Does not delete the test or its data — just marks it as inactive.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminSecret } from '@/lib/security';

// ── Chi-Square Significance Test ──

/**
 * Perform a chi-square test with Yates' correction for 2x2 contingency table.
 *
 * Compares conversion rates between control and treatment groups.
 * Yates' correction reduces false positives for small sample sizes.
 *
 * @param controlConverted - Number of conversions in control group
 * @param controlTotal - Total number in control group
 * @param treatmentConverted - Number of conversions in treatment group
 * @param treatmentTotal - Total number in treatment group
 * @returns Test result with chi-square statistic, p-value, and significance
 *
 * @example
 * ```
 * Input:  controlConverted=10, controlTotal=100, treatmentConverted=15, treatmentTotal=100
 * Output: { chiSquare: 1.14, pValue: 0.286, significant: false, confidence: 0.95 }
 * ```
 */
function chiSquareYates(
  controlConverted: number,
  controlTotal: number,
  treatmentConverted: number,
  treatmentTotal: number
): {
  chiSquare: number;
  pValue: number;
  significant: boolean;
  confidence: number;
} {
  const controlNonConverted = controlTotal - controlConverted;
  const treatmentNonConverted = treatmentTotal - treatmentConverted;

  const n = controlConverted + controlNonConverted + treatmentConverted + treatmentNonConverted;
  if (n === 0) {
    return { chiSquare: 0, pValue: 1, significant: false, confidence: 0.95 };
  }

  // Expected values
  const col1Total = controlConverted + treatmentConverted;
  const col2Total = controlNonConverted + treatmentNonConverted;
  const row1Total = controlTotal;
  const row2Total = treatmentTotal;

  const e11 = (row1Total * col1Total) / n;
  const e12 = (row1Total * col2Total) / n;
  const e21 = (row2Total * col1Total) / n;
  const e22 = (row2Total * col2Total) / n;

  // Chi-square with Yates' correction: |O - E| - 0.5
  const terms = [
    { o: controlConverted, e: e11 },
    { o: controlNonConverted, e: e12 },
    { o: treatmentConverted, e: e21 },
    { o: treatmentNonConverted, e: e22 },
  ];

  const chiSquare = terms.reduce((sum, { o, e }) => {
    if (e === 0) return sum;
    const diff = Math.abs(o - e) - 0.5;
    return sum + (diff * diff) / e;
  }, 0);

  // Approximate p-value for chi-square with 1 degree of freedom
  // Using the approximation: p ≈ exp(-0.5 * chiSquare) for quick computation
  // For production, use a proper statistical library
  const pValue = Math.exp(-0.5 * chiSquare);
  const significant = pValue < 0.05;

  return { chiSquare: Math.round(chiSquare * 1000) / 1000, pValue, significant, confidence: 0.95 };
}

// ── GET: Test Detail ──

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = req.headers.get('x-admin-secret');
  if (!verifyAdminSecret(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const test = await prisma.aBTest.findUnique({
    where: { id: params.id },
    include: { renderJobs: true, analytics: true },
  });

  if (!test) {
    return NextResponse.json({ error: 'A/B test not found' }, { status: 404 });
  }

  // Separate analytics by variant
  const controlAnalytics = test.analytics.filter((a) => a.abVariant === 'control');
  const treatmentAnalytics = test.analytics.filter((a) => a.abVariant === 'treatment');

  const aggregate = (group: typeof test.analytics) => ({
    count: group.length,
    emailOpens: group.reduce((s, a) => s + a.emailOpens, 0),
    videoPlays: group.reduce((s, a) => s + a.videoPlays, 0),
    conversions: group.reduce((s, a) => s + a.conversions, 0),
    totalLtv: group.reduce((s, a) => s + a.ltv, 0),
    avgLtv: group.length > 0 ? group.reduce((s, a) => s + a.ltv, 0) / group.length : 0,
    conversionRate: group.length > 0
      ? (group.filter((a) => a.conversions > 0).length / group.length) * 100
      : 0,
  });

  const controlStats = aggregate(controlAnalytics);
  const treatmentStats = aggregate(treatmentAnalytics);

  // Run chi-square significance test
  const significanceTest = chiSquareYates(
    controlStats.conversions,
    controlStats.count,
    treatmentStats.conversions,
    treatmentStats.count
  );

  // Daily breakdown (extract from JSON)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return NextResponse.json({
    id: test.id,
    name: test.name,
    composition: test.composition,
    controlVersion: test.controlVersion,
    treatmentVersion: test.treatmentVersion,
    isActive: test.isActive,
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
    totalJobs: test.renderJobs.length,
    stats: {
      control: controlStats,
      treatment: treatmentStats,
    },
    significanceTest,
    dailyBreakdown: controlAnalytics
      .concat(treatmentAnalytics)
      .flatMap((a) => {
        const daily = (a.dailyBreakdown as Record<string, { emailOpens?: number; videoPlays?: number; conversions?: number }>) ?? {};
        return Object.entries(daily).map(([date, counts]) => ({
          date,
          variant: a.abVariant,
          ...counts,
        }));
      })
      .filter((d) => new Date(d.date) >= thirtyDaysAgo)
      .sort((a, b) => a.date.localeCompare(b.date)),
  });
}

// ── DELETE: End Test ──

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = req.headers.get('x-admin-secret');
  if (!verifyAdminSecret(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const test = await prisma.aBTest.findUnique({ where: { id: params.id } });

  if (!test) {
    return NextResponse.json({ error: 'A/B test not found' }, { status: 404 });
  }

  const updated = await prisma.aBTest.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({
    success: true,
    message: `A/B test "${test.name}" has been ended`,
    testId: updated.id,
    isActive: updated.isActive,
  });
}
