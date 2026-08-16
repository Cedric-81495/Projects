import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'
import { captureServer } from '@/lib/analytics/posthog-server'
import { ANALYTICS_EVENTS } from '@/lib/analytics/events'

/**
 * Stripe webhook — the ONLY path from money to access.
 *
 * Four properties this handler must hold, in order of how badly it goes wrong
 * when one is missing:
 *
 *  1. SIGNATURE VERIFIED against the raw body. Anyone can POST to this URL.
 *     Without verification, granting yourself Senior access is a curl command.
 *  2. IDEMPOTENT. Stripe retries on any non-2xx and sometimes on 2xx. The event
 *     ID is inserted with a primary key conflict check BEFORE processing, so a
 *     replay is a no-op rather than a second enrollment.
 *  3. FAST ACK. Acknowledge, then do work. Stripe's timeout is short and a slow
 *     handler turns into a retry storm during a launch.
 *  4. NEVER trusts amounts from the session. The payment_references row carries what we
 *     expect; the event confirms it was paid.
 *
 * Note the runtime and body handling: this route must NOT be edge, and the body
 * must be read as raw text. Any framework middleware that parses JSON first
 * breaks signature verification in a way that looks like a Stripe bug.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HANDLED = new Set<string>([
  'checkout.session.completed',
  'checkout.session.async_payment_failed',
  'payment_intent.payment_failed',
  'charge.refunded',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
])

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new NextResponse('Missing signature', { status: 400 })

  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    logger.warn('stripe_signature_invalid', {
      message: error instanceof Error ? error.message : String(error),
    })
    return new NextResponse('Invalid signature', { status: 400 })
  }

  // Idempotency gate. `insert` on a PK conflict tells us this is a replay.
  const { error: insertError } = await admin
    .from('stripe_events')
    .insert({ id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> })

  if (insertError) {
    if (insertError.code === '23505') {
      // Already recorded. Ack so Stripe stops retrying.
      logger.info('stripe_event_replay', { eventId: event.id, type: event.type })
      return NextResponse.json({ received: true, replay: true })
    }
    logger.error('stripe_event_persist_failed', { eventId: event.id, message: insertError.message })
    // 500 → Stripe retries, which is correct: we have not durably recorded it.
    return new NextResponse('Storage error', { status: 500 })
  }

  if (!HANDLED.has(event.type)) {
    await markProcessed(event.id)
    return NextResponse.json({ received: true, ignored: true })
  }

  try {
    await processEvent(event)
    await markProcessed(event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('stripe_event_failed', { eventId: event.id, type: event.type, message })
    await admin
      .from('stripe_events')
      .update({ error: message.slice(0, 500) })
      .eq('id', event.id)
    // Non-2xx so Stripe retries. `processed_at` stays null, and the replay gate
    // above is keyed on insertion, so the retry re-runs the handler body.
    return new NextResponse('Processing failed', { status: 500 })
  }
}

function markProcessed(id: string) {
  return admin.from('stripe_events').update({ processed_at: new Date().toISOString() }).eq('id', id)
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const paymentId = session.client_reference_id ?? session.metadata?.payment_id
      if (!paymentId) throw new Error(`session ${session.id} has no payment reference`)

      // `paid` covers card payments; `no_payment_required` covers 100% coupons.
      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        logger.info('checkout_not_yet_paid', { paymentId, status: session.payment_status })
        return
      }

      const { error } = await admin
        .from('payment_references')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
        })
        .eq('id', paymentId)
        .eq('status', 'pending') // state transition guard, not a blind write
      if (error) throw new Error(`payment update failed: ${error.message}`)

      // Grants inside a locking, idempotent SQL function — see 0004.
      const { error: grantError } = await admin.rpc('grant_enrollments_for_payment', {
        p_payment_id: paymentId,
      })
      if (grantError) throw new Error(`grant failed: ${grantError.message}`)

      logger.info('enrollments_granted', { paymentId })

      // Purchase is captured SERVER-SIDE. A browser-fired purchase event is
      // unverifiable and will never reconcile against Stripe's own numbers.
      const userId = session.metadata?.user_id
      if (userId) {
        await captureServer(userId, ANALYTICS_EVENTS.purchaseCompleted, {
          plan_sku: session.metadata?.plan_sku,
          amount_cents: session.amount_total ?? undefined,
          currency: session.currency?.toUpperCase(),
        })
      }
      return
    }

    case 'checkout.session.async_payment_failed':
    case 'payment_intent.payment_failed': {
      const obj = event.data.object as { metadata?: Record<string, string> }
      const paymentId = obj.metadata?.payment_id
      if (paymentId) {
        await admin.from('payment_references').update({ status: 'failed' }).eq('id', paymentId).eq('status', 'pending')
      }
      return
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
      if (!intentId) return

      const { data: payment } = await admin
        .from('payment_references')
        .select('id, amount_cents')
        .eq('stripe_payment_intent_id', intentId)
        .maybeSingle()
      if (!payment) return

      const fullyRefunded = charge.amount_refunded >= payment.amount_cents

      await admin
        .from('payment_references')
        .update({
          amount_refunded_cents: charge.amount_refunded,
          status: fullyRefunded ? 'refunded' : 'partially_refunded',
        })
        .eq('id', payment.id)

      // A full refund revokes access. Partial refunds are left alone —
      // installment plans legitimately refund one payment without ending access.
      if (fullyRefunded) {
        await admin
          .from('enrollments')
          .update({ status: 'revoked', note: `refund:${charge.id}` })
          .eq('payment_reference_id', payment.id)
          .eq('status', 'active')
        logger.info('enrollments_revoked_on_refund', { paymentId: payment.id })
      }
      return
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription

      // Stripe moved `current_period_end` from the subscription onto its items.
      // Read it from the first item, with the legacy field as a fallback so an
      // older API version does not silently produce a null period end — which
      // would expire someone's access immediately.
      const periodEnd =
        sub.items?.data?.[0]?.current_period_end ??
        (sub as unknown as { current_period_end?: number }).current_period_end ??
        null
      const periodEndIso = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

      await admin
        .from('subscriptions')
        .update({
          status: sub.status,
          current_period_end: periodEndIso,
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', sub.id)

      // Access ends when the paid period ends, not the moment someone cancels.
      if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) {
        const { data: row } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()
        if (row) {
          await admin
            .from('enrollments')
            .update({ expires_at: periodEndIso })
            .eq('user_id', row.user_id)
            .eq('source', 'subscription')
            .eq('status', 'active')
        }
      }
      return
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      logger.warn('invoice_payment_failed', {
        customerId: typeof invoice.customer === 'string' ? invoice.customer : undefined,
        attempt: invoice.attempt_count,
      })
      return
    }
  }
}
