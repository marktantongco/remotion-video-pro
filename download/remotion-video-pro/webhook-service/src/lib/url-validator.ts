/**
 * @module url-validator
 * @description SSRF (Server-Side Request Forgery) protection utilities.
 * Validates and sanitizes URLs to prevent access to internal resources.
 */

import { URL } from 'url';

// ── Types ──

export interface ValidationResult {
  valid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

// ── Configuration ──

/**
 * Hostnames that are always blocked (private/internal ranges).
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254',
  'metadata.aws.internal',
  'metadata',
]);

/**
 * Blocked IP ranges (CIDR notation) — private and link-local networks.
 */
const BLOCKED_RANGES: Array<{ start: number; end: number }> = [
  // Loopback: 127.0.0.0/8
  { start: ipToLong('127.0.0.0'), end: ipToLong('127.255.255.255') },
  // Private Class A: 10.0.0.0/8
  { start: ipToLong('10.0.0.0'), end: ipToLong('10.255.255.255') },
  // Private Class B: 172.16.0.0/12
  { start: ipToLong('172.16.0.0'), end: ipToLong('172.31.255.255') },
  // Private Class C: 192.168.0.0/16
  { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255') },
  // Link-local: 169.254.0.0/16
  { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255') },
  // Carrier-grade NAT: 100.64.0.0/10
  { start: ipToLong('100.64.0.0'), end: ipToLong('100.127.255.255') },
];

/**
 * Allowed URL protocols.
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// ── Helpers ──

/**
 * Convert an IPv4 dotted-decimal string to a 32-bit integer.
 */
function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Check if an IP address falls within any blocked range.
 */
function isBlockedIp(ip: string): boolean {
  const longIp = ipToLong(ip);
  return BLOCKED_RANGES.some((range) => longIp >= range.start && longIp <= range.end);
}

/**
 * Check if a hostname resolves to a blocked address.
 * For now, checks against known blocked hostnames.
 * In production, you'd want to do actual DNS resolution here.
 */
function isBlockedHostname(hostname: string): boolean {
  // Direct hostname match
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return true;
  }

  // Check if hostname ends with a blocked suffix (e.g., "localhost.localdomain")
  for (const blocked of BLOCKED_HOSTNAMES) {
    if (hostname.toLowerCase().endsWith(`.${blocked}`)) {
      return true;
    }
  }

  // Check if the hostname is an IP in a blocked range
  const ipv4Match = hostname.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (ipv4Match) {
    if (isBlockedIp(ipv4Match[1])) {
      return true;
    }
  }

  return false;
}

// ── Core Functions ──

/**
 * Validate a URL for SSRF safety.
 *
 * Checks:
 * - Valid URL format
 * - Allowed protocol (http/https only)
 * - Non-blocked hostname (no localhost, private IPs, cloud metadata)
 * - Non-blocked IP ranges
 *
 * @param rawUrl - The URL string to validate
 * @param options - Optional validation options
 * @returns Validation result with sanitized URL or error
 *
 * @example
 * ```ts
 * const result = validateUrl(userProvidedUrl);
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * const safeUrl = result.sanitizedUrl!;
 * ```
 */
export function validateUrl(
  rawUrl: string,
  options?: {
    /** Custom list of additional allowed hostnames */
    allowedHostnames?: string[];
    /** Maximum URL length (default: 2048) */
    maxLength?: number;
  }
): ValidationResult {
  // Check URL length
  const maxLength = options?.maxLength ?? 2048;
  if (rawUrl.length > maxLength) {
    return { valid: false, error: `URL exceeds maximum length of ${maxLength} characters` };
  }

  // Parse URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check protocol
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { valid: false, error: `Protocol "${parsed.protocol}" is not allowed. Only HTTP and HTTPS are permitted.` };
  }

  // Check hostname
  if (isBlockedHostname(parsed.hostname)) {
    return { valid: false, error: 'Access to internal/private hostnames is blocked (SSRF protection)' };
  }

  // Check against explicit allowlist if provided
  if (options?.allowedHostnames && options.allowedHostnames.length > 0) {
    const isAllowed = options.allowedHostnames.some(
      (allowed) => parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`)
    );
    if (!isAllowed) {
      return { valid: false, error: `Hostname "${parsed.hostname}" is not in the allowed list` };
    }
  }

  // Reconstruct sanitized URL (strips auth, normalizes path)
  const sanitized = `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`;

  return { valid: true, sanitizedUrl: sanitized };
}

/**
 * Validate an array of URLs for SSRF safety.
 *
 * @param urls - Array of URL strings to validate
 * @param options - Optional validation options
 * @returns Object with valid URLs, invalid URLs, and errors
 */
export function validateUrls(
  urls: string[],
  options?: { allowedHostnames?: string[]; maxLength?: number }
): { valid: string[]; invalid: Array<{ url: string; error: string }> } {
  const valid: string[] = [];
  const invalid: Array<{ url: string; error: string }> = [];

  for (const url of urls) {
    const result = validateUrl(url, options);
    if (result.valid) {
      valid.push(result.sanitizedUrl!);
    } else {
      invalid.push({ url, error: result.error! });
    }
  }

  return { valid, invalid };
}
