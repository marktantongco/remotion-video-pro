/**
 * @route POST/GET /api/ab
 * @description A/B test management — create and list tests.
 *
 * POST: Create a new A/B test for a composition.
 *   - Only 1 active test per composition is allowed
 *   - Admin auth required
 *   - Creates control/treatment variant configuration
 *
 * GET: List all A/B tests with aggregated stats.
 *   - Admin auth required
 *   - Returns per-test aggregate: control vs treatment counts, conversion rates, avg LTV
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { verifyAdminSecret } from '@/lib/security';

// ── Validation ──

const createABTestSchema = z.object({
  name: z.string().min(1).max(200),
  composition: z.string().min(1).max(100),
  controlVersion: z.string().min(1),
  treatmentVersion: z.string().min(1),
});

// ── POST: Create A/B Test ──

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!verifyAdminSecret(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createABTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, composition, controlVersion, treatmentVersion } = parsed.data;

  // Check for existing active test on this composition
  const existing = await prisma.aBTest.findFirst({
    where: { composition, isActive: true },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: `An active A/B test already exists for composition "${composition}"`,
        existingTestId: existing.id,
        existingTestName: existing.name,
      },
      { status: 409 }
    );
  }

  const test = await prisma.aBTest.create({
    data: {
      name,
      composition,
      controlVersion,
      treatmentVersion,
    },
  });

  return NextResponse.json(
    { success: true, testId: test.id, name: test.name, composition: test.composition },
    { status: 201 }
  );
}

// ── GET: List A/B Tests ──

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!verifyAdminSecret(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const composition = searchParams.get('composition');
  const activeOnly = searchParams.get('active') !== 'false';

  const where: Record<string, unknown> = {};
  if (composition) where.composition = composition;
  if (activeOnly) where.isActive = true;

  const tests = await prisma.aBTest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      analytics: true,
      _count: { select: { renderJobs: true } },
    },
  });

  // Aggregate stats per test
  const results = await Promise.all(
    tests.map(async (test) => {
      const allAnalytics = await prisma.renderAnalytics.findMany({
        where: { abTestId: test.id },
      });

      const control = allAnalytics.filter((a) => a.abVariant === 'control');
      const treatment = allAnalytics.filter((a) => a.abVariant === 'treatment');

      const aggregate = (group: typeof allAnalytics) => ({
        count: group.length,
        emailOpens: group.reduce((s, a) => s + a.emailOpens, 0),
        videoPlays: group.reduce((s, a) => s + a.videoPlays, 0),
        conversions: group.reduce((s, a) => s + a.conversions, 0),
        avgLtv: group.length > 0 ? group.reduce((s, a) => s + a.ltv, 0) / group.length : 0,
        conversionRate: group.length > 0
          ? (group.filter((a) => a.conversions > 0).length / group.length) * 100
          : 0,
      });

      return {
        id: test.id,
        name: test.name,
        composition: test.composition,
        controlVersion: test.controlVersion,
        treatmentVersion: test.treatmentVersion,
        isActive: test.isActive,
        totalJobs: test._count.renderJobs,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
        stats: {
          control: aggregate(control),
          treatment: aggregate(treatment),
        },
      };
    })
  );

  return NextResponse.json({ tests: results, total: results.length });
}
