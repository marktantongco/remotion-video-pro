/**
 * rate-limit.ts — Sliding-window in-memory rate limiter.
 *
 * Tracks request counts per IP + endpoint using a Map with automatic TTL cleanup.
 * No external dependencies (no Redis needed at the API layer).
 *
 * Usage:
 * ```ts
 * import { rateLimit } from '@/lib/rate-limit';
 *
 * const { allowed, retryAfter, remaining } = rateLimit({
 *   key: getClientIp(req),
 *   endpoint: '/api/render',
 *   method: 'POST',
 * });
 *
 * if (!allowed) return rateLimitResponse(retryAfter);
 * ```
 *
 * @module rate-limit
 */

/** Rate limit configuration per endpoint + method */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Rate limit rule keyed by `endpoint:method` */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'POST:/api/render': { limit: 60, windowSeconds: 60 },
  'GET:/api/render': { limit: 120, windowSeconds: 60 },
  'POST:/api/batch': { limit: 10, windowSeconds: 60 },
  'GET:/api/batch': { limit: 120, windowSeconds: 60 },
  'POST:/api/stripe-webhook': { limit: 100, windowSeconds: 60 },
  'POST:/api/composition/activate': { limit: 30, windowSeconds: 60 },
  'PUT:/api/composition/activate': { limit: 30, windowSeconds: 60 },
  'GET:/api/composition/activate': { limit: 120, windowSeconds: 60 },
  'DELETE:/api/composition/activate': { limit: 30, windowSeconds: 60 },
  'POST:/api/ab': { limit: 30, windowSeconds: 60 },
  'GET:/api/ab': { limit: 120, windowSeconds: 60 },
  'GET:/api/ab/[id]': { limit: 120, windowSeconds: 60 },
  'DELETE:/api/ab/[id]': { limit: 30, windowSeconds: 60 },
  'POST:/api/analytics/track': { limit: 100, windowSeconds: 60 },
};

/** Default rate limit for unconfigured endpoints */
const DEFAULT_LIMIT: RateLimitConfig = { limit: 120, windowSeconds: 60 };

/** A single timestamped request entry */
interface RequestEntry {
  timestamp: number;
}

/**
 * In-memory store: `ip:endpoint:method` → sorted array of request timestamps.
 * Entries older than their window are lazily pruned on each check.
 */
const store = new Map<string, RequestEntry[]>();

/** How often to run garbage collection (every 5 minutes) */
const GC_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Garbage collector — removes expired entries to prevent memory leaks.
 * Runs automatically on an interval.
 */
function garbageCollect(): void {
  const now = Date.now();
  for (const [key, entries] of store.entries()) {
    // Find the configured window for this key
    const maxAgeMs = (getDefaultConfig(key).windowSeconds + 10) * 1000;
    const filtered = entries.filter((e) => now - e.timestamp < maxAgeMs);
    if (filtered.length === 0) {
      store.delete(key);
    } else if (filtered.length < entries.length) {
      store.set(key, filtered);
    }
  }
}

// Start GC timer
if (typeof globalThis !== 'undefined') {
  setInterval(garbageCollect, GC_INTERVAL_MS);
}

/**
 * Resolve rate limit config for a given key.
 * Extracts endpoint pattern from the key if it contains brackets.
 */
function getDefaultConfig(key: string): RateLimitConfig {
  // Try exact match first
  if (RATE_LIMITS[key]) {
    return RATE_LIMITS[key];
  }

  // Try matching without [id] patterns
  for (const pattern of Object.keys(RATE_LIMITS)) {
    if (pattern.includes('[id]')) {
      const regex = new RegExp(pattern.replace('[id]', '[^/]+'));
      if (regex.test(key)) {
        return RATE_LIMITS[pattern];
      }
    }
  }

  return DEFAULT_LIMIT;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds until the client can retry (0 if allowed) */
  retryAfter: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Total request limit for this window */
  limit: number;
  /** Seconds until the window resets */
  resetAfter: number;
}

/**
 * Check rate limit for a given client + endpoint + method.
 *
 * Uses a sliding window approach: records are stored with timestamps,
 * and only records within the configured window count against the limit.
 *
 * @param key - Unique identifier combining IP, endpoint, and method
 * @param endpoint - The API endpoint path (e.g., '/api/render')
 * @param method - HTTP method (e.g., 'POST')
 * @returns Rate limit check result
 */
export function rateLimit(key: string, endpoint: string, method: string): RateLimitResult {
  const methodKey = `${method}:${endpoint}`;
  const fullKey = `${key}:${methodKey}`;
  const config = RATE_LIMITS[methodKey] || getDefaultConfig(fullKey);

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;

  // Get or create entries for this key
  let entries = store.get(fullKey);

  if (!entries) {
    entries = [];
    store.set(fullKey, entries);
  }

  // Prune old entries (within this window only)
  const validEntries = entries.filter((e) => e.timestamp > windowStart);

  const requestCount = validEntries.length;

  if (requestCount >= config.limit) {
    // Calculate retryAfter based on oldest entry in the window
    const oldestInWindow = validEntries[0];
    const retryAfterSec = Math.ceil((oldestInWindow.timestamp + windowMs - now) / 1000);
    const resetAfterSec = Math.ceil((oldestInWindow.timestamp + windowMs - now) / 1000);

    return {
      allowed: false,
      retryAfter: retryAfterSec,
      remaining: 0,
      limit: config.limit,
      resetAfter: resetAfterSec,
    };
  }

  // Record this request
  validEntries.push({ timestamp: now });
  store.set(fullKey, validEntries);

  const remaining = config.limit - validEntries.length;
  const resetAfterSec = Math.ceil(
    (validEntries[0].timestamp + windowMs - now) / 1000
  );

  return {
    allowed: true,
    retryAfter: 0,
    remaining,
    limit: config.limit,
    resetAfter: Math.max(0, resetAfterSec),
  };
}
