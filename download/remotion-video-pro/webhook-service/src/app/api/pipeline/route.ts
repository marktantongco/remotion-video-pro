/**
 * @route POST/GET /api/pipeline
 * @description Pipeline execution and status endpoint.
 *
 * POST: Trigger a new pipeline execution.
 *   - Authenticates via x-webhook-secret header (timing-safe comparison)
 *   - Rate-limited to 10 requests per minute per IP
 *   - Validates all input parameters with Zod
 *   - Validates source URLs against SSRF protection rules
 *   - Executes the pipeline asynchronously
 *   - Returns the pipeline ID and initial stage statuses
 *
 * GET: Retrieve the status of an existing pipeline.
 *   - Authenticates via x-webhook-secret header
 *   - Returns full pipeline result including all stage statuses
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyWebhookSecret, sanitizeJobResponse } from '@/lib/security';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateUrls } from '@/lib/url-validator';
import { runPipeline, getPipelineStatus } from '@/lib/pipeline';
import { validateRoute } from '@/lib/pipeline-routes';
import { PipelineStage, PipelineResult } from '@/lib/pipeline';

// ── Constants ──

/** Rate limit: 10 pipeline requests per minute per IP */
const PIPELINE_RATE_LIMIT = 10;
const PIPELINE_RATE_WINDOW_MS = 60_000;

// ── Zod Schemas ──

/**
 * Validation schema for POST /api/pipeline requests.
 * Ensures all required fields are present and properly typed.
 */
const pipelineCreateSchema = z.object({
  /** Named pipeline route that determines stage sequence */
  route: z.enum(['competitor-intel', 'product-launch', 'personalized-videos', 'content-repurpose', 'ab-testing']),
  /** Remotion composition ID for the render stage */
  compositionId: z.string().min(1).max(200),
  /** Optional URLs for data acquisition (validated against SSRF rules) */
  sourceUrls: z.array(z.string().url().max(2048)).max(50).optional(),
  /** Optional callback URL for pipeline completion notification */
  callbackUrl: z.string().url().max(2048).optional(),
  /** Optional A/B test ID to link test results */
  abTestId: z.string().max(200).optional(),
  /** Optional priority for render queue jobs */
  priority: z.number().int().min(1).max(10).optional(),
  /** Optional arbitrary metadata passed to stages */
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Validation schema for GET /api/pipeline query parameters.
 */
const pipelineQuerySchema = z.object({
  id: z.string().min(1),
});

// ── POST: Create and Execute Pipeline ──

/**
 * POST /api/pipeline
 *
 * Trigger a new multi-stage pipeline execution.
 *
 * @example
 * ```bash
 * curl -X POST /api/pipeline \
 *   -H "x-webhook-secret: $WEBHOOK_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "route": "content-repurpose",
 *     "compositionId": "BlogToVideo",
 *     "sourceUrls": ["https://blog.example.com/my-post"],
 *     "callbackUrl": "https://myapp.com/webhook/pipeline-done",
 *     "priority": 8
 *   }'
 * ```
 */
export async function POST(req: NextRequest) {
  // ── Auth: Verify webhook secret (timing-safe) ──
  const providedSecret = req.headers.get('x-webhook-secret');
  if (!verifyWebhookSecret(providedSecret, process.env.WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate Limiting ──
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const rateLimit = checkRateLimit(
    `pipeline:${clientIp}`,
    PIPELINE_RATE_LIMIT,
    PIPELINE_RATE_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // ── Parse & Validate Body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = pipelineCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── Validate Route ──
  let routeConfig;
  try {
    routeConfig = validateRoute(data.route);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid pipeline route' },
      { status: 400 }
    );
  }

  // ── Validate Source URLs (SSRF Protection) ──
  if (data.sourceUrls && data.sourceUrls.length > 0) {
    if (routeConfig.requiresSourceUrls) {
      // For routes requiring source URLs, ensure at least one is provided
      const { valid, invalid } = validateUrls(data.sourceUrls);
      if (valid.length === 0) {
        return NextResponse.json(
          {
            error: 'All source URLs failed SSRF validation',
            details: invalid.map((i) => ({ url: i.url, error: i.error })),
          },
          { status: 400 }
        );
      }
      // Replace with validated URLs
      data.sourceUrls = valid;
    } else {
      // For routes that don't require URLs, just validate what's provided
      const { valid, invalid } = validateUrls(data.sourceUrls);
      data.sourceUrls = valid;
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: 'Some source URLs failed SSRF validation',
            blocked: invalid.map((i) => ({ url: i.url, error: i.error })),
          },
          { status: 400 }
        );
      }
    }
  } else if (routeConfig.requiresSourceUrls) {
    return NextResponse.json(
      {
        error: `Pipeline route "${data.route}" requires source URLs`,
        requiredFields: ['sourceUrls'],
      },
      { status: 400 }
    );
  }

  // ── Validate Callback URL (SSRF Protection) ──
  if (data.callbackUrl) {
    const { validateUrl } = await import('@/lib/url-validator');
    const callbackValidation = validateUrl(data.callbackUrl);
    if (!callbackValidation.valid) {
      return NextResponse.json(
        { error: `Invalid callback URL: ${callbackValidation.error}` },
        { status: 400 }
      );
    }
    data.callbackUrl = callbackValidation.sanitizedUrl;
  }

  // ── Execute Pipeline ──
  try {
    const pipeline = await runPipeline({
      id: `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${data.route} pipeline — ${data.compositionId}`,
      route: data.route,
      stages: routeConfig.stages,
      compositionId: data.compositionId,
      sourceUrls: data.sourceUrls,
      abTestId: data.abTestId,
      webhookSecret: process.env.WEBHOOK_SECRET!,
      callbackUrl: data.callbackUrl,
      priority: data.priority,
      metadata: data.metadata,
    });

    // Sanitize response to remove PII
    const sanitizedPipeline = sanitizeJobResponse<PipelineResult>(pipeline);

    return NextResponse.json(
      {
        pipelineId: sanitizedPipeline.id,
        status: sanitizedPipeline.status,
        stages: sanitizedPipeline.stages.map((s) => ({
          stage: s.stage,
          status: s.status,
          durationMs: s.durationMs,
          error: s.error,
        })),
        totalDurationMs: sanitizedPipeline.totalDurationMs,
        renderJobId: sanitizedPipeline.renderJobId,
      },
      {
        status: pipeline.status === 'failed' ? 500 : 200,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (err) {
    console.error('[Pipeline API] Pipeline execution failed:', err);
    return NextResponse.json(
      {
        error: 'Pipeline execution failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ── GET: Pipeline Status ──

/**
 * GET /api/pipeline?id=<pipelineId>
 *
 * Retrieve the current status and results of a pipeline execution.
 *
 * @example
 * ```bash
 * curl -X GET "/api/pipeline?id=pipe_abc123" \
 *   -H "x-webhook-secret: $WEBHOOK_SECRET"
 * ```
 */
export async function GET(req: NextRequest) {
  // ── Auth: Verify webhook secret (timing-safe) ──
  const providedSecret = req.headers.get('x-webhook-secret');
  if (!verifyWebhookSecret(providedSecret, process.env.WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse Query Params ──
  const pipelineId = req.nextUrl.searchParams.get('id');
  if (!pipelineId) {
    return NextResponse.json(
      { error: 'Missing required query parameter: id' },
      { status: 400 }
    );
  }

  const parsedQuery = pipelineQuerySchema.safeParse({ id: pipelineId });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: 'Invalid pipeline ID', issues: parsedQuery.error.issues },
      { status: 400 }
    );
  }

  // ── Retrieve Pipeline ──
  const pipeline = getPipelineStatus(parsedQuery.data.id);
  if (!pipeline) {
    return NextResponse.json(
      { error: 'Pipeline not found', pipelineId: parsedQuery.data.id },
      { status: 404 }
    );
  }

  // ── Sanitize and Return ──
  const sanitized = sanitizeJobResponse<PipelineResult>(pipeline);

  return NextResponse.json(sanitized);
}
