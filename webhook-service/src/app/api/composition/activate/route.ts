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

// ── Auth ──
// Admin secret protects all composition management endpoints.
// Set ADMIN_SECRET in env. Separate from WEBHOOK_SECRET (which is for external systems).
// VULN-1: Now uses timing-safe comparison via withAdmin() from security.ts

// ── POST: Activate a specific version ──
// Flips isActive=false on all versions of a composition, then flips the target to true.
// Deploy, test, then activate with a single curl call.
const activateSchema = z.object({
  composition: z.string().min(1),
  version: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // VULN-4: Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/composition/activate', 'POST');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // VULN-1: Timing-safe admin auth check
  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const body = await req.json();
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { composition, version } = parsed.data;

  // Atomically: deactivate all versions, activate the target
  const result = await prisma.$transaction([
    // Deactivate all versions of this composition
    prisma.compositionVersion.updateMany({
      where: { composition },
      data: { isActive: false },
    }),
    // Activate the specific version (create if missing)
    prisma.compositionVersion.upsert({
      where: {
        composition_version: { composition, version },
      },
      create: {
        composition,
        version,
        isActive: true,
      },
      update: {
        isActive: true,
      },
    }),
  ]);

  // Fetch current state for response
  const allVersions = await prisma.compositionVersion.findMany({
    where: { composition },
    orderBy: { deployedAt: 'desc' },
  });

  const active = allVersions.find((v) => v.isActive);

  return NextResponse.json({
    success: true,
    composition,
    activeVersion: active?.version,
    message: `${composition}@${version} is now active. ${result[0].count} other version(s) deactivated.`,
    versions: allVersions.map((v) => ({
      version: v.version,
      isActive: v.isActive,
      deployedAt: v.deployedAt,
      description: v.description,
    })),
  });
}

// ── PUT: Register a new version (without activating) ──
// Deploy first, test, then POST to activate.
const registerSchema = z.object({
  composition: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  // VULN-4: Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/composition/activate', 'PUT');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // VULN-1: Timing-safe admin auth check
  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { composition, version, description } = parsed.data;

  try {
    const entry = await prisma.compositionVersion.create({
      data: {
        composition,
        version,
        isActive: false, // Registered but NOT active — test before activating
        description,
      },
    });

    return NextResponse.json({
      success: true,
      composition: entry.composition,
      version: entry.version,
      isActive: false,
      message: `Registered ${composition}@${version} as inactive. Test it, then POST to activate.`,
    });
  } catch (err) {
    // Unique constraint violation — version already exists
    if (err instanceof Error && err.message.includes('Unique')) {
      return NextResponse.json(
        { error: `${composition}@${version} already exists` },
        { status: 409 }
      );
    }
    throw err;
  }
}

// ── GET: List all versions of a composition ──
export async function GET(req: NextRequest) {
  // VULN-4: Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/composition/activate', 'GET');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // VULN-1: Timing-safe admin auth check
  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const composition = req.nextUrl.searchParams.get('composition');

  const where = composition ? { composition } : {};
  const versions = await prisma.compositionVersion.findMany({
    where,
    orderBy: [{ composition: 'asc' }, { deployedAt: 'desc' }],
  });

  // Group by composition
  const grouped: Record<string, typeof versions> = {};
  for (const v of versions) {
    if (!grouped[v.composition]) grouped[v.composition] = [];
    grouped[v.composition].push(v);
  }

  return NextResponse.json({
    compositions: grouped,
    total: versions.length,
    active: versions.filter((v) => v.isActive).length,
  });
}

// ── DELETE: Deactivate a specific version ──
export async function DELETE(req: NextRequest) {
  // VULN-4: Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/composition/activate', 'DELETE');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // VULN-1: Timing-safe admin auth check
  if (!withAdmin(req)) {
    return adminUnauthorizedResponse();
  }

  const composition = req.nextUrl.searchParams.get('composition');
  const version = req.nextUrl.searchParams.get('version');

  if (!composition || !version) {
    return NextResponse.json(
      { error: 'Missing composition and version query params' },
      { status: 400 }
    );
  }

  await prisma.compositionVersion.updateMany({
    where: { composition, version },
    data: { isActive: false },
  });

  return NextResponse.json({
    success: true,
    message: `${composition}@${version} deactivated.`,
  });
}
