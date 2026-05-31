/**
 * @module rate-limit
 * @description Sliding window rate limiter for protecting API endpoints.
 * Uses an in-memory store with automatic expiration for simplicity.
 * For production with multiple instances, replace with Redis-backed implementation.
 */

// ── Types ──

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// ── In-Memory Store ──

const store = new Map<string, RateLimitEntry>();

// ── Configuration ──

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60; // 60 requests per minute

// ── Cleanup ──

/**
 * Interval for cleaning up expired entries.
 * Runs every 5 minutes to prevent unbounded memory growth.
 */
const CLEANUP_INTERVAL_MS = 300_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the periodic cleanup of expired rate limit entries.
 * Safe to call multiple times — only one timer is created.
 */
function ensureCleanup(): void {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        // Remove entries where all timestamps are older than the window
        const validTimestamps = entry.timestamps.filter(
          (ts) => now - ts < DEFAULT_WINDOW_MS
        );
        if (validTimestamps.length === 0) {
          store.delete(key);
        } else {
          entry.timestamps = validTimestamps;
        }
      }
    }, CLEANUP_INTERVAL_MS);

    // Allow the process to exit even if the timer is running
    if (cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  }
}

// ── Core Functions ──

/**
 * Check if a request is allowed under the rate limit for the given key.
 *
 * Uses a sliding window algorithm: counts requests within the configured
 * time window and allows the request if under the limit.
 *
 * @param key - Unique identifier for the rate limit bucket (e.g., IP address, API key)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Duration of the sliding window in milliseconds
 * @returns Rate limit result with allowance status and metadata
 *
 * @example
 * ```ts
 * const result = checkRateLimit('192.168.1.1', 10, 60_000);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS
): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    // First request — create a new entry
    store.set(key, { timestamps: [now] });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
      limit: maxRequests,
    };
  }

  // Filter out timestamps outside the sliding window
  const validTimestamps = entry.timestamps.filter(
    (ts) => now - ts < windowMs
  );
  entry.timestamps = validTimestamps;

  if (validTimestamps.length >= maxRequests) {
    // Rate limit exceeded
    const oldestInWindow = validTimestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
      limit: maxRequests,
    };
  }

  // Under the limit — record this request
  validTimestamps.push(now);
  entry.timestamps = validTimestamps;

  return {
    allowed: true,
    remaining: maxRequests - validTimestamps.length,
    resetAt: validTimestamps[0] + windowMs,
    limit: maxRequests,
  };
}

/**
 * Reset the rate limit for a specific key.
 * Useful for admin operations or testing.
 *
 * @param key - The rate limit bucket to reset
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clear all rate limit entries.
 * Useful for testing or admin operations.
 */
export function clearAllRateLimits(): void {
  store.clear();
}

/**
 * Get the current number of tracked rate limit entries.
 * Useful for monitoring and debugging.
 *
 * @returns Number of active rate limit buckets
 */
export function getRateLimitEntryCount(): number {
  return store.size;
}
