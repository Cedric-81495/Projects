import 'server-only'
import Stripe from 'stripe'
import { env } from '@/lib/env'

/**
 * A single configured Stripe instance.
 *
 * `apiVersion` is pinned deliberately. Letting it float means Stripe can change
 * a payload shape under you between deploys, and you find out through a webhook
 * that stops granting access.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // Intentionally omitted: the installed SDK pins its own matching API version.
  // Hardcoding a mismatched string is a compile error, and hardcoding a stale
  // one silently changes payload shapes under you between deploys. Upgrade the
  // SDK deliberately instead.
  typescript: true,
  maxNetworkRetries: 2,
  timeout: 10_000,
  appInfo: { name: 'GWOP University', version: '1.0.0' },
})

/** Picks the price ID matching the deployed mode, so staging never charges a real card. */
export function priceIdFor(product: { stripe_price_id_live: string | null; stripe_price_id_test: string | null }) {
  return env.STRIPE_MODE === 'live' ? product.stripe_price_id_live : product.stripe_price_id_test
}
