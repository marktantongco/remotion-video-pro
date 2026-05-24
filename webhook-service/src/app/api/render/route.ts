import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderQueue } from '@/lib/queue';
import { prisma } from '@/lib/db';
import {
  withAuth,
  unauthorizedResponse,
  sanitizeJobResponse,
  rateLimitResponse,
  getClientIp,
} from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

const webhookSchema = z.object({
  event: z.string().min(1).max(100),
  data: z.record(z.unknown()).refine(
    (d) => Object.keys(d).length > 0,
    { message: 'Webhook data must not be empty' }
  ),
  version: z.string().optional(), // Explicit version pinning: "v1", "v2"
});

// Event → latest active composition version
// Version routing: if client sends "version", use that pinned version
// If no version, resolve from CompositionVersion table (latest active)
const EVENT_MAP: Record<string, string> = {
  'user.created': 'WelcomeVideo',
  'order.completed': 'ThankYouVideo',
  'lead.qualified': 'DemoVideo',
  'milestone.reached': 'AchievementVideo',
  'subscription.renewed': 'RenewalVideo',
};

async function resolveCompositionVersion(
  composition: string,
  requestedVersion?: string
): Promise<{ composition: string; version: string }> {
  if (requestedVersion) {
    // Explicit version requested — verify it exists
    const entry = await prisma.compositionVersion.findUnique({
      where: { composition_version: { composition, version: requestedVersion } },
    });
    if (!entry) {
      throw new Error(`Composition ${composition}@${requestedVersion} not found`);
    }
    return { composition, version: requestedVersion };
  }

  // No version specified — use latest active version
  const active = await prisma.compositionVersion.findFirst({
    where: { composition, isActive: true },
    orderBy: { deployedAt: 'desc' },
  });

  if (active) {
    return { composition, version: active.version };
  }

  // No version registry entry — pass through without version
  return { composition, version: 'default' };
}

export async function POST(req: NextRequest) {
  // VULN-4: Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/render', 'POST');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // VULN-1: Timing-safe comparison for webhook secret
  if (!withAuth(req)) {
    return unauthorizedResponse();
  }

  const body = await req.json();
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const baseComposition = EVENT_MAP[parsed.data.event];
  if (!baseComposition) {
    return NextResponse.json({ error: `Unknown event: ${parsed.data.event}` }, { status: 400 });
  }

  // Resolve version
  let resolved: { composition: string; version: string };
  try {
    resolved = await resolveCompositionVersion(baseComposition, parsed.data.version);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Version resolution failed' },
      { status: 400 }
    );
  }

  // Use versioned composition ID for Lambda (e.g., "ThankYouVideo:v2")
  const compositionId = resolved.version === 'default'
    ? resolved.composition
    : `${resolved.composition}:${resolved.version}`;

  const job = await prisma.renderJob.create({
    data: {
      composition: resolved.composition,
      version: resolved.version,
      props: parsed.data.data as any,
      status: 'pending',
    },
  });

  await renderQueue.add('render', {
    composition: compositionId,
    props: parsed.data.data,
    jobId: job.id,
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });

  return NextResponse.json({
    success: true,
    jobId: job.id,
    composition: compositionId,
    version: resolved.version,
    status: 'queued',
  });
}

export async function GET(req: NextRequest) {
  // VULN-4: Rate limiting
  const rl = rateLimit(getClientIp(req), '/api/render', 'GET');
  if (!rl.allowed) {
    return rateLimitResponse(rl.retryAfter);
  }

  // VULN-3: Require authentication for GET — prevents PII exposure
  if (!withAuth(req)) {
    return unauthorizedResponse();
  }

  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // VULN-3: Sanitize response — strip PII from job props before returning
  const sanitized = sanitizeJobResponse(job as unknown as Record<string, unknown>);

  return NextResponse.json(sanitized);
}
