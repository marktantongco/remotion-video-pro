/**
 * @module security
 * @description Cryptographic and authentication helpers for the webhook service.
 * Provides timing-safe secret comparison, HMAC utilities, and auth middleware patterns.
 */

import { createHmac, timingSafeEqual } from 'crypto';

// ── Timing-Safe Comparison ──

/**
 * Compare two strings in constant time to prevent timing attacks.
 *
 * Used for comparing webhook secrets, API keys, and HMAC digests.
 * Falls back to `false` if lengths differ (no timing leak since
 * Buffer length check is not data-dependent in Node.js).
 *
 * @param a - First string (e.g., provided secret)
 * @param b - Second string (e.g., expected secret)
 * @returns `true` if strings are byte-identical, `false` otherwise
 *
 * @example
 * ```ts
 * const isValid = timingSafeEqualStr(secret, expectedSecret);
 * ```
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

// ── HMAC Utilities ──

const HMAC_ALGORITHM = 'sha256';

/**
 * Generate an HMAC-SHA256 digest for the given message using the provided secret.
 *
 * @param message - The data to authenticate
 * @param secret - The shared secret key
 * @returns Hex-encoded HMAC string
 */
export function generateHmac(message: string, secret: string): string {
  return createHmac(HMAC_ALGORITHM, secret)
    .update(message)
    .digest('hex');
}

/**
 * Verify an HMAC-SHA256 digest in constant time.
 *
 * @param message - The original data
 * @param secret - The shared secret key
 * @param providedHmac - The HMAC to verify against
 * @returns `true` if the HMAC matches, `false` otherwise
 */
export function verifyHmac(
  message: string,
  secret: string,
  providedHmac: string
): boolean {
  const expected = generateHmac(message, secret);
  return timingSafeEqualStr(expected, providedHmac);
}

// ── Auth Helpers ──

/**
 * Verify a webhook secret from an incoming request header against an environment variable.
 *
 * Uses timing-safe comparison to prevent timing attacks on the secret.
 *
 * @param providedSecret - The secret value from the request header
 * @param envSecret - The expected secret from environment variables
 * @returns `true` if the secrets match, `false` otherwise
 */
export function verifyWebhookSecret(
  providedSecret: string | null,
  envSecret: string | undefined
): boolean {
  if (!providedSecret || !envSecret) {
    return false;
  }
  return timingSafeEqualStr(providedSecret, envSecret);
}

/**
 * Verify an admin secret from an incoming request header against an environment variable.
 *
 * Uses timing-safe comparison to prevent timing attacks on the secret.
 *
 * @param providedSecret - The secret value from the request header
 * @param envSecret - The expected secret from environment variables
 * @returns `true` if the secrets match, `false` otherwise
 */
export function verifyAdminSecret(
  providedSecret: string | null,
  envSecret: string | undefined
): boolean {
  if (!providedSecret || !envSecret) {
    return false;
  }
  return timingSafeEqualStr(providedSecret, envSecret);
}

// ── PII Sanitization ──

/**
 * Fields that should be redacted from API responses to prevent PII leakage.
 */
const PII_FIELDS = new Set([
  'email',
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'credit_card',
  'creditCard',
  'ssn',
  'phone',
]);

/**
 * Recursively sanitize an object by redacting PII fields.
 *
 * Replaces values of known PII fields with `[REDACTED]`.
 * Traverses nested objects and arrays.
 *
 * @param obj - The object to sanitize
 * @returns A new object with PII fields redacted
 *
 * @example
 * ```ts
 * const clean = sanitizeJobResponse({ email: 'user@example.com', name: 'Alice' });
 * // => { email: '[REDACTED]', name: 'Alice' }
 * ```
 */
export function sanitizeJobResponse<T = Record<string, unknown>>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T;
  }

  if (typeof obj !== 'object') {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJobResponse) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeJobResponse(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
