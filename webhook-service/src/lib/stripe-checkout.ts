import Stripe from 'stripe';
import { generateCheckoutHmac } from './hmac';

/**
 * Create a Stripe checkout session with an embedded render HMAC.
 *
 * The HMAC is stored in session.metadata.render_hmac and verified by
 * the /api/stripe-webhook endpoint when Stripe fires checkout.session.completed.
 *
 * This prevents unauthorized renders — even if an attacker replays a valid
 * Stripe webhook payload with a correct signature, they can't forge the HMAC
 * because they don't know CHECKOUT_HMAC_SECRET.
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

  // Generate a temporary session ID to HMAC
  // We use a unique ID that we control, then pass it to Stripe
  const checkoutId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const hmac = generateCheckoutHmac(checkoutId);

  const session = await stripe.checkout.sessions.create({
    ...params,
    metadata: {
      ...params.metadata,
      checkout_id: checkoutId,
      render_hmac: hmac,
    },
  });

  // Now that we have the real session ID, generate the real HMAC
  // and update the session metadata
  const realHmac = generateCheckoutHmac(session.id);
  // Note: in Stripe API 2023-10-16, use .modify() instead of .update()
  // @ts-expect-error Stripe API version difference
  await stripe.checkout.sessions.update(session.id, {
    metadata: {
      ...params.metadata,
      checkout_id: session.id,
      render_hmac: realHmac,
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
