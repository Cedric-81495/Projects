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
  /* ⚠ ADDED so `processing` and `requires_action` are actually reachable.
     0018 put both in the payment_status enum and nothing ever wrote them —
     the state machine looked complete and had two states no code could enter.
     A customer sitting in 3-D Secure appeared as `pending`, indistinguishable
     from someone who had not started. */
  'payment_intent.processing',
  'payment_intent.requires_action',
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

  /* ══ CLAIM THE EVENT ═══════════════════════════════════════════════════
     ⚠ A CONDITIONAL UPDATE, NOT A READ THEN A DECISION.

     The insert above records the event. This claims the right to PROCESS it,
     and the two are deliberately separate concerns.

     History of this gate, because it has been wrong twice:

       v1  acked on any duplicate key. A handler that failed still left the
           row behind, so every Stripe retry was dismissed as a replay. It
           stranded a paid $197 purchase with no enrollment, unrecoverable.

       v2  read `processed_at` and reprocessed when null. Correct for a retry
           after failure — but two deliveries arriving together BOTH saw null
           (neither had finished) and both processed. No duplicate enrollment
           resulted, only because the grant's conflict clause absorbed it.

       v3  this. claim_stripe_event() is a single UPDATE whose WHERE clause
           picks the winner. Exactly one caller can move the row out of
           `claimed_at is null`, at any concurrency. Everyone else acks.

     The claim also expires after five minutes, so a function timeout mid-grant
     does not strand the event the way v1 did. */
  if (insertError && insertError.code !== '23505') {
    logger.error('stripe_event_persist_failed', {
      eventId: event.id,
      message: insertError.message,
    })
    // 500 → Stripe retries, correct: we have not durably recorded it.
    return new NextResponse('Storage error', { status: 500 })
  }

  const { data: claimed } = await admin.rpc('claim_stripe_event', {
    p_event_id: event.id,
  })

  if (!claimed) {
    /* Either finished already, or another request is working on it right now.
       Ack either way: if it is in flight, that request will report its own
       failure and Stripe will retry then. */
    logger.info('stripe_webhook_duplicate', { eventId: event.id, type: event.type })
    return NextResponse.json({ received: true, duplicate: true })
  }

  /* ⚠ CIRCUIT BREAKER. claim_stripe_event increments `attempts`, so this reads
     the value it just set. Stripe gives up after ~3 days; this stops us
     burning function time on an event that needs a human. The row keeps
     `error` and is findable:
       select * from stripe_events where processed_at is null and attempts >= 6; */
  const { data: evRow } = await admin
    .from('stripe_events')
    .select('attempts')
    .eq('id', event.id)
    .maybeSingle()

  if ((evRow?.attempts ?? 0) > 6) {
    logger.error('stripe_event_abandoned', { eventId: event.id, attempts: evRow?.attempts })
    return NextResponse.json({ received: true, abandoned: true })
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
    /* Non-2xx so Stripe retries. `processed_at` stays null, and the replay
       gate above now checks it — so the retry genuinely re-runs the handler
       instead of being acked as a duplicate. That was the bug. */
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
    /* ══ INTERMEDIATE STATES ═════════════════════════════════════════════
       Neither grants nor revokes anything. They exist so a retry from the
       browser can tell "the bank is deciding" from "nothing has happened",
       and return the right thing instead of starting a second checkout.

       ⚠ NARROWED BY status, so a late-arriving intermediate event cannot pull
       a completed payment backwards. The trigger in 0018 would reject it
       anyway, but an exception raised inside the webhook means a 500 and a
       pointless Stripe retry — better to filter it out here. Stripe does not
       guarantee delivery order. */
    case 'payment_intent.processing':
    case 'payment_intent.requires_action': {
      const intent = event.data.object as Stripe.PaymentIntent
      const paymentId = intent.metadata?.payment_id
      if (!paymentId) return

      const next = event.type === 'payment_intent.processing'
        ? 'processing'
        : 'requires_action'

      const { error } = await admin
        .from('payment_references')
        .update({ status: next, stripe_payment_intent_id: intent.id })
        .eq('id', paymentId)
        .in('status', ['pending', 'processing', 'requires_action'])

      if (error) throw new Error(`intermediate state update failed: ${error.message}`)
      logger.info('payment_state_advanced', { paymentId, status: next })
      return
    }

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
      /* ⚠ THIS BRANCH CANNOT TELL A CANCELLATION FROM A COMPLETED PLAN, AND
         THE DIFFERENCE IS SOMEBODY'S $1,191.

         Surpaul's memo §1 defines the plan as three payments, not a recurring
         subscription. A fixed instalment ENDS by design — the schedule that
         stops it at three emits customer.subscription.deleted with status
         `canceled`, which is byte-for-byte what a genuine cancellation emits.
         Reaching the code below in that case sets expires_at on the
         enrollments of the buyer who just finished paying in full.

         ⚠ THE GUARD IS A HOLD, NOT THE FIX. Nothing inserts into
         `subscriptions` anywhere in this codebase, so `row` is always null
         today and the update never runs — the path is dormant, not safe. The
         moment somebody adds that insert to build the plan, this branch goes
         live with the bug in it. So it refuses to act unless a row exists AND
         that row records fewer payments than the plan required.

         The real fix is a completion branch ahead of this one: three paid means
         permanent, expires_at = null, never touched again. See the build note
         under BLUEPRINT_BUNDLE in config/membership.ts. */
      if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) {
        const { data: row } = await admin
          .from('subscriptions')
          .select('user_id, payments_made, payments_required')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()

        const completed =
          row?.payments_required != null &&
          (row?.payments_made ?? 0) >= row.payments_required

        if (completed) {
          /* Paid in full. Access is theirs — say so in the log rather than
             failing silently, because a plan completing is the event most
             likely to be mistaken for this handler doing nothing. */
          logger.info('subscription_plan_completed', {
            subscriptionId: sub.id,
            paymentsMade: row?.payments_made,
          })
          return
        }

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
