import { createHmac } from 'crypto';

const HMAC_ALGORITHM = 'sha256';
const HMAC_KEY_ENV = 'CHECKOUT_HMAC_SECRET';

/**
 * Generate an HMAC for a Stripe checkout session.
 *
 * Call this when creating the Stripe checkout session.
 * Store the returned HMAC in the session's metadata as "render_hmac".
 *
 * When the webhook fires, verifyCheckoutHmac() recomputes and compares.
 * This prevents replay attacks — even if someone has a valid Stripe webhook
 * signature, they can't trigger a render for a session whose HMAC they
 * didn't generate.
 *
 * @param sessionId - The Stripe CheckoutSession.id
 * @returns Hex-encoded HMAC string
 */
export function generateCheckoutHmac(sessionId: string): string {
  const secret = process.env[HMAC_KEY_ENV];
  if (!secret) {
    throw new Error(`${HMAC_KEY_ENV} environment variable is not set`);
  }

  return createHmac(HMAC_ALGORITHM, secret)
    .update(sessionId)
    .digest('hex');
}

/**
 * Verify an HMAC from a Stripe checkout session webhook.
 *
 * Extract `render_hmac` from session metadata, recompute from session ID,
 * and compare using constant-time comparison (timing-safe).
 *
 * @param sessionId - The Stripe CheckoutSession.id from the webhook
 * @param providedHmac - The value of session.metadata.render_hmac
 * @returns true if HMAC matches, false if mismatch or missing
 */
export function verifyCheckoutHmac(
  sessionId: string,
  providedHmac?: string | null
): boolean {
  const secret = process.env[HMAC_KEY_ENV];

  // If no HMAC secret configured, skip verification (dev mode)
  if (!secret) {
    console.warn('CHECKOUT_HMAC_SECRET not set — HMAC verification skipped');
    return true;
  }

  // If no HMAC in metadata, reject
  if (!providedHmac) {
    console.error(`HMAC verification failed: no render_hmac in metadata for session ${sessionId}`);
    return false;
  }

  const expected = generateCheckoutHmac(sessionId);

  // Timing-safe comparison to prevent timing attacks
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(providedHmac, 'hex');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}
