import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  withAdmin,
  adminUnauthorizedResponse,
  rateLimitResponse,
  getClientIp,
} from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/ab — Create a new A/B test.
 * Requires admin authentication.
 *
 * Body: { name, composition, controlVersion, treatmentVersion, stripeMetadataKey }
 */

const createABTestSchema = z.object({
  name: z.string().min(1).max(100),
  composition: z.string().min(1),
  controlVersion: z.string().min(1),
  treatmentVersion: z.string().min(1),
  stripeMetadataKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(getClientIp(req), '/api/ab', 'POST');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const body = await req.json();
  const parsed = createABTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, composition, controlVersion, treatmentVersion, stripeMetadataKey } = parsed.data;

  // Check for active test on same composition (only one active per composition)
  const existingActive = await prisma.aBTest.findFirst({
    where: { composition, isActive: true },
  });

  if (existingActive) {
    return NextResponse.json(
      {
        error: `An active A/B test already exists for ${composition}`,
        existingTest: { id: existingActive.id, name: existingActive.name },
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
      stripeMetadataKey,
    },
  });

  return NextResponse.json(
    { success: true, test },
    { status: 201 }
  );
}

/**
 * GET /api/ab — List all A/B tests with aggregated results.
 * Query: ?composition=ThankYouVideo (optional filter)
 * Returns: test config + per-variant stats (count, avg LTV, conversion rate)
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(getClientIp(req), '/api/ab', 'GET');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const composition = req.nextUrl.searchParams.get('composition');

  const where = composition ? { composition } : {};
  const tests = await prisma.aBTest.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    include: {
      renderJobs: {
        select: {
          id: true,
          abVariant: true,
          status: true,
        },
      },
    },
  });

  // Aggregate stats per test
  const results = await Promise.all(
    tests.map(async (test) => {
      // Get all jobs for this test
      const allJobs = await prisma.renderJob.findMany({
        where: { abTestId: test.id },
        include: { analytics: true },
      });

      const controlJobs = allJobs.filter((j) => j.abVariant === 'control');
      const treatmentJobs = allJobs.filter((j) => j.abVariant === 'treatment');

      // Calculate per-variant stats
      const calcStats = (jobs: typeof allJobs) => {
        const total = jobs.length;
        const completed = jobs.filter((j) => j.status === 'done').length;
        const conversions = jobs.filter((j) =>
          j.analytics.some((a) => a.conversion === true)
        ).length;
        const ltvValues = jobs
          .flatMap((j) => j.analytics.map((a) => a.ltv))
          .filter((v): v is number => v !== null && v !== undefined);
        const avgLtv = ltvValues.length > 0
          ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length
          : null;

        return {
          total,
          completed,
          conversions,
          conversionRate: total > 0 ? conversions / total : 0,
          avgLtv: avgLtv !== null ? Math.round(avgLtv * 100) / 100 : null,
        };
      };

      return {
        ...test,
        stats: {
          control: calcStats(controlJobs),
          treatment: calcStats(treatmentJobs),
        },
      };
    })
  );

  return NextResponse.json({ tests: results, total: results.length });
}
