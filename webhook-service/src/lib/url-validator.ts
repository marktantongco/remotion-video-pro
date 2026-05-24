/**
 * url-validator.ts — SSRF (Server-Side Request Forgery) protection for callback URLs.
 *
 * Validates that callback URLs are safe to send requests to by checking:
 * - Protocol must be HTTPS (except localhost for development)
 * - Must not point to private/internal IP ranges
 * - Must not point to AWS metadata endpoint
 * - Optional domain whitelist via ALLOWED_CALLBACK_DOMAINS env var
 *
 * @module url-validator
 */

import { URL } from 'url';

/** IPv4 private/internal ranges */
const PRIVATE_RANGES: Array<{ start: bigint; end: bigint }> = [
  { start: 0n, end: 0n },                         // 0.0.0.0/8 — Current network
  { start: 10n, end: 10n },                        // 10.0.0.0/8 — Class A private
  { start: 127n, end: 127n },                      // 127.0.0.0/8 — Loopback
  { start: 169n, end: 169n },                      // 169.254.x.x — Link-local
  { start: 172n, end: 173n },                      // 172.16.0.0/12 — Class B private
  { start: 192n, end: 192n },                      // 192.168.0.0/16 — Class C private
];

/** Specific blocked hostnames */
const BLOCKED_HOSTNAMES = [
  '169.254.169.254',   // AWS metadata endpoint
  'metadata.google.internal', // GCP metadata
  'metadata.azure.com',       // Azure metadata
  'localhost',
  'metadata',
];

/**
 * Convert an IPv4 address string to a BigInt for range comparison.
 *
 * @param ip - IPv4 address string (e.g., "192.168.1.1")
 * @returns BigInt representation of the IP
 */
function ipToBigInt(ip: string): bigint {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  // (firstOctet << 24) | (secondOctet << 16) | (thirdOctet << 8) | fourthOctet
  return (
    (BigInt(parts[0]) << 24n) |
    (BigInt(parts[1]) << 16n) |
    (BigInt(parts[2]) << 8n) |
    BigInt(parts[3])
  );
}

/**
 * Check if an IPv4 address falls within private/internal ranges.
 *
 * @param ip - IPv4 address string
 * @returns true if the IP is private or internal
 */
function isPrivateIp(ip: string): boolean {
  try {
    const ipBigInt = ipToBigInt(ip);

    for (const range of PRIVATE_RANGES) {
      const rangeStart = range.start << 24n;
      const rangeEnd = range.end << 24n;

      if (range.start === range.end) {
        // Exact first octet match — check different subnet sizes
        const octet = ipBigInt >> 24n;
        if (octet === range.start) {
          // 10.x.x.x — full /8 private
          if (range.start === 10n) return true;

          // 127.x.x.x — full /8 loopback
          if (range.start === 127n) return true;

          // 169.x.x.x — check 169.254.x.x specifically
          if (range.start === 169n) {
            const secondOctet = (ipBigInt >> 16n) & 0xFFn;
            if (secondOctet === 254n) return true;
          }

          // 172.16-31.x.x — /12 private
          if (range.start === 172n) {
            const secondOctet = (ipBigInt >> 16n) & 0xFFn;
            if (secondOctet >= 16n && secondOctet <= 31n) return true;
          }

          // 192.168.x.x — /16 private
          if (range.start === 192n) {
            const secondOctet = (ipBigInt >> 16n) & 0xFFn;
            if (secondOctet === 168n) return true;
          }

          // 0.x.x.x — /8 current network
          if (range.start === 0n) return true;
        }
      }
    }

    return false;
  } catch {
    // If we can't parse the IP, be safe and reject
    return true;
  }
}

/**
 * Validate a callback URL to prevent SSRF attacks.
 *
 * @param urlString - The URL string to validate
 * @param options - Optional validation options
 * @returns An object with `valid` flag and optional `error` message
 */
export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

export interface UrlValidationOptions {
  /** Allow localhost URLs (for development) */
  allowLocalhost?: boolean;
  /** Require HTTPS (default: true) */
  requireHttps?: boolean;
}

/**
 * Validate that a callback URL is safe to use.
 *
 * Checks:
 * 1. URL is well-formed
 * 2. Protocol is HTTPS (unless localhost allowed in dev)
 * 3. Hostname is not a blocked metadata endpoint
 * 4. Resolved IP is not in a private range
 * 5. Domain is in the optional whitelist (if ALLOWED_CALLBACK_DOMAINS is set)
 *
 * @param urlString - The URL to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateCallbackUrl(
  urlString: string,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  const { allowLocalhost = false, requireHttps = true } = options;

  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: `Invalid URL: ${urlString}` };
  }

  // Must be HTTP or HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Unsupported protocol: ${parsed.protocol}. Only HTTP/HTTPS allowed.` };
  }

  // Require HTTPS unless localhost is allowed (dev mode)
  if (requireHttps && parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
    return { valid: false, error: 'HTTPS required for callback URLs' };
  }

  // Check blocked hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    if (hostname === 'localhost' && allowLocalhost) {
      // Allow localhost in dev mode
    } else {
      return { valid: false, error: `Blocked hostname: ${hostname}` };
    }
  }

  // Check for private IPs (skip for localhost in dev mode)
  if (!allowLocalhost || hostname !== 'localhost') {
    // Simple IPv4 check in hostname
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    if (ipv4Regex.test(hostname)) {
      if (isPrivateIp(hostname)) {
        return { valid: false, error: `Private/internal IP not allowed: ${hostname}` };
      }
    }

    // Check for numeric IPs that bypass DNS (e.g., http://2130706433/ = 127.0.0.1)
    const numericIp = Number(hostname);
    if (!isNaN(numericIp) && isFinite(numericIp)) {
      // Convert decimal IP to dotted notation
      const ip = `${(numericIp >>> 24) & 255}.${(numericIp >>> 16) & 255}.${(numericIp >>> 8) & 255}.${numericIp & 255}`;
      if (isPrivateIp(ip)) {
        return { valid: false, error: `Numeric IP resolves to private range: ${ip}` };
      }
    }
  }

  // Check domain whitelist if configured
  const allowedDomains = process.env.ALLOWED_CALLBACK_DOMAINS;
  if (allowedDomains) {
    const whitelist = allowedDomains.split(',').map((d) => d.trim().toLowerCase());
    const isWhitelisted = whitelist.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
    if (!isWhitelisted && hostname !== 'localhost') {
      return {
        valid: false,
        error: `Domain not in whitelist. Allowed: ${allowedDomains}`,
      };
    }
  }

  return { valid: true };
}
