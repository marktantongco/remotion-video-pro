/**
 * security.ts — Shared authentication, authorization, and security utilities.
 *
 * Provides constant-time secret comparison, unified auth middleware helpers,
 * PII sanitization for API responses, and client IP extraction.
 *
 * @module security
 */

import { timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * Standard `===` comparison short-circuits on the first differing character,
 * leaking information about the secret's prefix via response time.
 * This function always compares the full buffer regardless of differences.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    // Perform a dummy comparison of equal-length padded buffers
    // to maintain constant-time behavior even on length mismatch
    const maxLen = Math.max(bufA.length, bufB.length);
    const padA = Buffer.alloc(maxLen, 0);
    const padB = Buffer.alloc(maxLen, 0);
    bufA.copy(padA);
    bufB.copy(padB);
    try {
      cryptoTimingSafeEqual(padA, padB);
    } catch {
      // Ignore — just for timing consistency
    }
    return false;
  }

  return cryptoTimingSafeEqual(bufA, bufB);
}

/**
 * Check if a request has valid webhook or admin authentication.
 *
 * Accepts either `x-webhook-secret` (for external webhook systems)
 * or `x-admin-secret` (for admin operations).
 *
 * @param req - The incoming Next.js request
 * @returns true if authenticated, false otherwise
 */
export function withAuth(req: NextRequest): boolean {
  const webhookSecret = req.headers.get('x-webhook-secret');
  const adminSecret = req.headers.get('x-admin-secret');

  if (webhookSecret && process.env.WEBHOOK_SECRET) {
    if (timingSafeEqual(webhookSecret, process.env.WEBHOOK_SECRET)) {
      return true;
    }
  }

  if (adminSecret && process.env.ADMIN_SECRET) {
    if (timingSafeEqual(adminSecret, process.env.ADMIN_SECRET)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a request has valid admin-only authentication.
 *
 * Requires `x-admin-secret` header. Use this for destructive
 * or sensitive admin-only operations.
 *
 * @param req - The incoming Next.js request
 * @returns true if admin authenticated, false otherwise
 */
export function withAdmin(req: NextRequest): boolean {
  const adminSecret = req.headers.get('x-admin-secret');

  if (!adminSecret || !process.env.ADMIN_SECRET) {
    return false;
  }

  return timingSafeEqual(adminSecret, process.env.ADMIN_SECRET);
}

/**
 * Sanitize a render job object by stripping PII before returning in API responses.
 *
 * Removes sensitive fields like email, customerName, and other personal data
 * from the props JSON while preserving the job status metadata.
 *
 * @param job - The raw render job object from the database
 * @returns A sanitized job object safe for API responses
 */
export function sanitizeJobResponse(job: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...job };

  // Strip PII from props if present
  if (sanitized.props && typeof sanitized.props === 'object') {
    const props = { ...(sanitized.props as Record<string, unknown>) };

    // Mask common PII fields
    const piiFields = [
      'email', 'customerEmail', 'customer_email',
      'customerName', 'customer_name',
    ];
    for (const field of piiFields) {
      if (props[field] && typeof props[field] === 'string') {
        const val = props[field] as string;
        props[field] = val.length <= 3
          ? '***'
          : `${val[0]}${'*'.repeat(val.length - 2)}${val[val.length - 1]}`;
      }
    }

    // Mask amount fields
    const amountFields = ['amount'];
    for (const field of amountFields) {
      if (props[field] && typeof props[field] === 'string') {
        props[field] = '[REDACTED]';
      }
    }

    sanitized.props = props;
  }

  return sanitized;
}

/**
 * Extract the client's IP address from a request.
 *
 * Checks common proxy headers (X-Forwarded-For, X-Real-IP) before
 * falling back to the direct connection IP.
 *
 * @param req - The incoming Next.js request
 * @returns The client IP address string
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return req.ip || '127.0.0.1';
}

/**
 * Create an unauthorized response helper.
 *
 * Returns a consistent 401 JSON response for authentication failures.
 *
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized — provide x-webhook-secret or x-admin-secret header' },
    { status: 401 }
  );
}

/**
 * Create an admin-only unauthorized response helper.
 *
 * @returns NextResponse with 401 status
 */
export function adminUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized — admin access required (x-admin-secret header)' },
    { status: 401 }
  );
}

/**
 * Create a rate-limited response helper.
 *
 * @param retryAfter - Seconds until the client can retry
 * @returns NextResponse with 429 status
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  );
}
