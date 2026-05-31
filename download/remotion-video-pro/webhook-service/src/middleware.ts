/**
 * @module middleware
 * @description Next.js middleware for security headers and CORS.
 *
 * Applies 7 security headers to all responses:
 * 1. X-Content-Type-Options: nosniff — prevents MIME type sniffing
 * 2. X-Frame-Options: DENY — prevents clickjacking via iframes
 * 3. X-XSS-Protection: 1; mode=block — legacy XSS filter (defense-in-depth)
 * 4. Referrer-Policy: strict-origin-when-cross-origin — limits referrer leakage
 * 5. Permissions-Policy: restricts browser features (camera, microphone, geolocation)
 * 6. Content-Security-Policy: API-appropriate CSP
 * 7. Strict-Transport-Security: HSTS with includeSubDomains
 *
 * CORS headers are applied to /api/* routes only.
 * Preflight OPTIONS requests are handled automatically.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Security Headers ──

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
  'Content-Security-Policy':
    "default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

// ── CORS Configuration ──

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Webhook-Secret, X-Admin-Secret, X-Composition-Version, X-Analytics-Token',
  'Access-Control-Max-Age': '86400', // 24 hours preflight cache
};

// ── Middleware ──

export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers to ALL responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Apply CORS headers to API routes only
  if (req.nextUrl.pathname.startsWith('/api')) {
    const origin = req.headers.get('origin');

    if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  return response;
}

// ── Matcher ──

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
