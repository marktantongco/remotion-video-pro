import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { generateCheckoutHmac } from './hmac';

/**
 * Create a Stripe checkout session with an embedded render HMAC.
 *
 * The HMAC is generated using a checkout ID that combines the session
 * creation timestamp with a crypto-safe random suffix. This single-step
 * approach avoids the need to update the session after creation (Stripe
 * Checkout sessions are immutable after creation).
 *
 * @param params - Stripe checkout session creation params
 * @returns The created Stripe checkout session
 */
export async function createSecureCheckoutSession(
  params: Omit<Stripe.Checkout.SessionCreateParams, 'metadata'> & {
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  });

  // Generate a unique checkout ID using crypto-safe randomness
  const checkoutId = `chk_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const hmac = generateCheckoutHmac(checkoutId);

  const session = await stripe.checkout.sessions.create({
    ...params,
    metadata: {
      ...params.metadata,
      checkout_id: checkoutId,
      render_hmac: hmac,
    },
  });

  return session;
}

/**
 * Simplified checkout for the common case.
 *
 * Usage:
 * ```ts
 * const session = await createCheckout({
 *   mode: 'payment',
 *   line_items: [{ price: 'price_xxx', quantity: 1 }],
 *   success_url: 'https://yoursite.com/success',
 *   cancel_url: 'https://yoursite.com/cancel',
 *   metadata: { brand_color: '#ff0055', customer_name: 'Alice' },
 * });
 * ```
 */
export async function createCheckout(
  params: Omit<Stripe.Checkout.SessionCreateParams, 'metadata'> & {
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  return createSecureCheckoutSession(params);
}
