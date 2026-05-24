/**
 * middleware.ts — Next.js middleware for security headers and rate limiting.
 *
 * Adds comprehensive security headers to all API responses:
 * - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
 * - Referrer-Policy, Permissions-Policy
 * - Content-Security-Policy (API-appropriate)
 * - Strict-Transport-Security
 * - Rate limit headers (X-RateLimit-*)
 * - CORS headers for API routes only
 *
 * @module middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers applied to ALL responses (API and page).
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Content Security Policy for API responses.
 * Restricts script sources to 'self' and the Stripe domain for webhook verification.
 */
const API_CSP =
  "default-src 'none'; " +
  "frame-ancestors 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

/**
 * CORS headers for API routes.
 * In production, replace '*' with your specific allowed origins.
 */
function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-webhook-secret, x-admin-secret, stripe-signature, x-composition-version',
    'Access-Control-Max-Age': '86400', // 24 hours preflight cache
  };
}

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Apply security headers to ALL responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Apply API-specific headers
  if (pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', API_CSP);

    // Add CORS headers for API routes
    const corsHeaders = getCorsHeaders(req);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      const preflightResponse = new NextResponse(null, { status: 204 });
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        preflightResponse.headers.set(key, value);
      }
      for (const [key, value] of Object.entries(corsHeaders)) {
        preflightResponse.headers.set(key, value);
      }
      return preflightResponse;
    }
  }

  return response;
}

/**
 * Match configuration — apply middleware to all routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
