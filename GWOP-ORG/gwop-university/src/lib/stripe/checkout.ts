import 'server-only'
import { stripe, priceIdFor } from './client'
import { admin } from '@/lib/supabase/admin'
import { publicEnv } from '@/lib/env'
import { ApiError, notFound } from '@/lib/http/errors'
import type { AuthContext } from '@/lib/auth/context'
import { logger } from '@/lib/observability/logger'

/**
 * Creates a Stripe Checkout Session.
 *
 * The security property to preserve: the browser sends a plan SKU and nothing
 * else about money. Price, currency, billing mode and what the purchase grants
 * are all resolved server-side from `membership_plans`. A tampered request
 * buys exactly the same thing at exactly the same price.
 *
 * This function grants no access. Its only job is to start a payment — the
 * webhook decides whether anything was actually bought.
 */
export async function createCheckoutSession(
  ctx: AuthContext,
  input: { plan_sku: string; idempotency_key: string; return_path: string },
) {
  const { data: plan } = await admin
    .from('membership_plans')
    .select('*')
    .eq('sku', input.plan_sku)
    .eq('published', true) // mirrors PRICING_PUBLISHED — unapproved plans cannot be bought
    .maybeSingle()

  if (!plan) throw notFound('Plan')

  const priceId = priceIdFor(plan)
  if (!priceId) {
    logger.error('plan_missing_stripe_price', { sku: plan.sku })
    throw new ApiError(503, 'upstream_unavailable', 'This plan is not available right now.')
  }

  // Reuse an existing pending payment for the same idempotency key rather than
  // creating a second Checkout Session. A double-tapped button on a slow
  // connection is the normal case, not the exception.
  const { data: existing } = await admin
    .from('payment_references')
    .select('id, stripe_checkout_session_id, status')
    .eq('user_id', ctx.userId)
    .eq('idempotency_key', input.idempotency_key)
    .maybeSingle()

  if (existing?.stripe_checkout_session_id && existing.status === 'pending') {
    const session = await stripe.checkout.sessions.retrieve(existing.stripe_checkout_session_id)
    if (session.url) return { paymentId: existing.id, url: session.url }
  }

  const customerId = await ensureStripeCustomer(ctx)

  const { data: payment, error } = await admin
    .from('payment_references')
    .insert({
      user_id: ctx.userId,
      plan_id: plan.id,
      amount_cents: plan.amount_cents,
      currency: plan.currency,
      status: 'pending',
      idempotency_key: input.idempotency_key,
      stripe_customer_id: customerId,
    })
    .select('id')
    .single()

  if (error || !payment) {
    logger.error('payment_create_failed', { message: error?.message })
    throw new ApiError(503, 'upstream_unavailable', 'Could not start checkout. Try again.')
  }

  const origin = publicEnv.NEXT_PUBLIC_SITE_URL
  // Relative paths only — already enforced by the Zod schema, re-checked here
  // so a future caller cannot turn this into an open redirect.
  const returnPath = input.return_path.startsWith('/') ? input.return_path : '/dashboard'

  const isSubscription = plan.billing === 'subscription'

  const session = await stripe.checkout.sessions.create(
    {
      mode: isSubscription ? 'subscription' : 'payment',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // The only trustworthy link between a Stripe event and our data.
      client_reference_id: payment.id,
      metadata: { payment_id: payment.id, user_id: ctx.userId, plan_sku: plan.sku },
      payment_intent_data: isSubscription
        ? undefined
        : { metadata: { payment_id: payment.id, user_id: ctx.userId } },
      success_url: `${origin}${returnPath}?checkout=success&ref=${payment.id}`,
      cancel_url: `${origin}${returnPath}?checkout=canceled`,
      // CAPABILITIES.promoCodes in config/membership.ts
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    // Stripe-level idempotency, on top of our own unique index.
    { idempotencyKey: `${ctx.userId}:${input.idempotency_key}` },
  )

  await admin
    .from('payment_references')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', payment.id)

  if (!session.url) throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable.')
  return { paymentId: payment.id, url: session.url }
}

async function ensureStripeCustomer(ctx: AuthContext): Promise<string> {
  const { data: prior } = await admin
    .from('payment_references')
    .select('stripe_customer_id')
    .eq('user_id', ctx.userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (prior?.stripe_customer_id) return prior.stripe_customer_id

  const customer = await stripe.customers.create({
    email: ctx.email,
    metadata: { supabase_user_id: ctx.userId },
  })
  return customer.id
}
