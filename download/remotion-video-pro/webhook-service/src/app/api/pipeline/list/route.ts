/**
 * @route GET /api/pipeline/list
 * @description Pipeline listing endpoint (admin-only).
 *
 * Returns a paginated list of all pipelines currently in the in-memory store.
 * Protected by x-admin-secret header with timing-safe comparison.
 *
 * Supports query parameters:
 * - `status` — Filter by pipeline status (running, completed, failed, partial)
 * - `route` — Filter by pipeline route name
 * - `limit` — Maximum results to return (default: 20, max: 100)
 * - `offset` — Number of results to skip (default: 0)
 *
 * @example
 * ```bash
 * curl -X GET "/api/pipeline/list?status=completed&limit=10" \
 *   -H "x-admin-secret: $ADMIN_SECRET"
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdminSecret, sanitizeJobResponse } from '@/lib/security';
import { listPipelines } from '@/lib/pipeline';

// ── Zod Schemas ──

/**
 * Validation schema for GET /api/pipeline/list query parameters.
 */
const listQuerySchema = z.object({
  /** Filter by pipeline status */
  status: z.enum(['running', 'completed', 'failed', 'partial']).optional(),
  /** Filter by pipeline route name */
  route: z.string().max(100).optional(),
  /** Maximum number of results (default: 20) */
  limit: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  /** Number of results to skip (default: 0) */
  offset: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(0))
    .optional(),
});

// ── GET: List Pipelines ──

/**
 * GET /api/pipeline/list
 *
 * List all pipelines with optional filtering and pagination.
 * Requires admin authentication via x-admin-secret header.
 */
export async function GET(req: NextRequest) {
  // ── Auth: Verify admin secret (timing-safe) ──
  const providedSecret = req.headers.get('x-admin-secret');
  if (!verifyAdminSecret(providedSecret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse Query Params ──
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const status = parsed.data.status;
  const route = parsed.data.route;
  const limit = parsed.data.limit ?? 20;
  const offset = parsed.data.offset ?? 0;

  // ── Retrieve & Filter Pipelines ──
  let pipelines = listPipelines();

  // Apply status filter
  if (status) {
    pipelines = pipelines.filter((p) => p.status === status);
  }

  // Apply route filter
  if (route) {
    pipelines = pipelines.filter((p) => p.config.route === route);
  }

  // Sort by creation time (newest first)
  pipelines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Calculate pagination metadata
  const total = pipelines.length;
  const paginatedPipelines = pipelines.slice(offset, offset + limit);

  // ── Sanitize and Return ──
  const sanitizedPipelines = paginatedPipelines.map((p) =>
    sanitizeJobResponse({
      id: p.id,
      name: p.config.name,
      route: p.config.route,
      status: p.status,
      compositionId: p.config.compositionId,
      stageCount: p.stages.length,
      completedStages: p.stages.filter((s) => s.status === 'completed').length,
      failedStages: p.stages.filter((s) => s.status === 'failed').length,
      totalDurationMs: p.totalDurationMs,
      renderJobId: p.renderJobId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })
  );

  return NextResponse.json({
    pipelines: sanitizedPipelines,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
    filters: {
      status: status ?? null,
      route: route ?? null,
    },
  });
}
