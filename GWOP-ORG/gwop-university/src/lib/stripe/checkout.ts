import 'server-only'
import type Stripe from 'stripe'
import { stripe, priceIdFor } from './client'
import { admin } from '@/lib/supabase/admin'
import { publicEnv } from '@/lib/env'
import { ApiError, notFound } from '@/lib/http/errors'
import type { AuthContext } from '@/lib/auth/context'
import { logger } from '@/lib/observability/logger'
import {
  BNPL_ALLOWED, BLUEPRINT_BUNDLE, bundleIsBestDeal, remainingSeparateTotal,
  UPGRADE_CREDIT_AT_CHECKOUT, upgradeToBundlePrice,
} from '@/config/membership'

/* ══ WHAT THE CUSTOMER MAY PAY WITH ════════════════════════════════════════
   ⚠ PINNED TO CARD. THIS IS THE FLAG BEING ENFORCED, NOT DESCRIBED.

   Until 2026-09-21 neither session passed payment_method_types at all, so
   Stripe fell back to whatever the Dashboard's automatic payment methods had
   enabled — which can include Klarna, Affirm and Afterpay, and can be turned
   on by anyone with Dashboard access without touching this repository.
   BNPL_ALLOWED was a comment describing an intention nothing enforced.

   Level 1 Module 8 teaches students to audit their buy-now-pay-later
   exposure. Selling the course through BNPL is a contradiction a buyer will
   notice, and screenshot. Master doc, Part Two: "If your checkout offers a
   buy-now-pay-later option, remove it."

   ⚠ THE DASHBOARD STILL HAS TO BE TURNED OFF TOO. This closes the code path;
   it does not change what is enabled on the account. Both, or neither counts.

   Returning undefined when BNPL_ALLOWED flips to true is deliberate: that
   hands the decision back to the Dashboard rather than silently encoding a
   second list here that would then need maintaining. */
const PAYMENT_METHOD_TYPES = BNPL_ALLOWED ? undefined : (['card'] as const)

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
  /* ⚠ NO idempotency_key. IT USED TO COME FROM THE BROWSER AND THAT WAS THE
     WHOLE PROBLEM.

     PlanCard sent `crypto.randomUUID()` on every click, so a double-tap, a
     refresh, or a client retry each produced a DIFFERENT key. The unique index
     on (user_id, idempotency_key) never fired, Stripe's own idempotency key
     differed, and each attempt created a separate Checkout Session capable of
     charging the customer again.

     The key is now derived here, from data the client cannot influence. */
  input: { plan_sku: string; return_path: string },
  /* What the buyer was shown and agreed to, resolved server-side in the route.
     Passed in rather than read here so this function stays free of request
     context and remains callable from a job or a test. */
  ack: {
    text: string
    version: string
    ip: string | null
    userAgent: string | null
  },
) {
  const { data: plan } = await admin
    .from('membership_plans')
    .select('*')
    .eq('sku', input.plan_sku)
    .eq('published', true) // mirrors PRICING_PUBLISHED — unapproved plans cannot be bought
    .maybeSingle()

  if (!plan) throw notFound('Plan')

  /* ══ ONE-TIME ONLY ═══════════════════════════════════════════════════════
     ⚠ THE LAST GATE BEFORE MONEY. Every layer above this already says no —
     config/membership.ts has no `monthly` field, 0021 forced billing to
     'one_time' on every row and asserted it, and scripts/seed-stripe.mts
     creates no recurring prices. This is the one that holds if somebody edits
     a row in the Supabase dashboard rather than in a migration.

     Master doc, Part Two: "No payment plans. No instalments. No
     subscriptions. No recurring charges of any kind." The three reasons are
     in config/membership.ts beside BLUEPRINT_BUNDLE; the short version is
     that instalments on a credit-challenged audience produce dunning and
     chargebacks rather than revenue, and CROA restricts collecting payment
     before promised services are performed.

     ⚠ REFUSE, DO NOT COERCE. Charging a plan marked 'subscription' once, as a
     payment, would take money against a row whose price may well be a
     recurring Stripe price — and would hide the misconfiguration instead of
     surfacing it. 503 rather than 400: nothing is wrong with the request, the
     server is holding something it should not be.

     The `mode: isSubscription ? …` branches further down are now unreachable
     and left in place on purpose — they are what still parses historical
     rows, and removing them is a separate change with its own review. */
  if (plan.billing !== 'one_time') {
    logger.error('plan_billing_not_one_time', { sku: plan.sku, billing: plan.billing })
    throw new ApiError(503, 'upstream_unavailable', 'This plan is not available right now.')
  }

  const priceId = priceIdFor(plan)
  if (!priceId) {
    logger.error('plan_missing_stripe_price', { sku: plan.sku })
    throw new ApiError(503, 'upstream_unavailable', 'This plan is not available right now.')
  }

  /* ══ REUSE BEFORE CREATE ═══════════════════════════════════════════════
     Three questions, in this order, because the answers are mutually
     exclusive and the expensive one is last.

     ⚠ ORDER MATTERS. Checking "already paid" before "already open" would let a
     refunded-then-repurchasing customer be handed a stale session. Checking
     "open" first and "paid" second would let someone who already owns the plan
     start a second checkout during the window before their first webhook
     lands. Paid is the more serious mistake, so it is checked first. */

  /* ── 1 · Already paid for this plan? Never charge twice. ────────────────
     Requirement 8. Backed by the partial unique index
     payments_one_paid_per_plan, so even a race cannot record a second one. */
  const { data: alreadyPaid } = await admin
    .from('payment_references')
    .select('id, status')
    .eq('user_id', ctx.userId)
    .eq('plan_id', plan.id)
    .eq('status', 'paid')
    .maybeSingle()

  if (alreadyPaid) {
    logger.info('checkout_already_paid', { paymentId: alreadyPaid.id, sku: plan.sku })
    /* 409, not an error page: the request is well-formed, the world has moved
       on. The client sends them to their dashboard. */
    throw new ApiError(
      409,
      'conflict',
      'You already own this level. It is available in your account.',
      { paymentId: alreadyPaid.id },
    )
  }

  /* ── 1b · Would the bundle overcharge somebody who already owns levels? ──
     ⚠ ADDED 2026-09-21. The membership page already hides the bundle card in
     this case via bundleIsBestDeal(), but hiding a card is not a guard. A
     direct link, a stale tab, a bookmark or an old email all reach this
     function with the card never rendered.

     The case that matters: a buyer holding Levels 2 and 3 has $694 of content
     left to buy. The bundle charges $997 for it. They would pay $1,691 in
     total for a $997 product, having done nothing wrong but click the thing
     in front of them. That purchase becomes a refund request, and the site
     says no refunds — so it becomes a chargeback, from exactly the audience
     the founder story is about.

     ⚠ THE SAME ARITHMETIC THE DISPLAY USES, NOT A SECOND RULE. Both go through
     bundleIsBestDeal(), so the card and the door can never disagree. Do not
     re-implement the comparison here.

     ⚠ NOT "OWNS ANY LEVEL". A Level 1 owner has $1,191 left to buy and saves
     $194 on the bundle — blocking them would cost the customer money and cost
     us a $997 sale. The rule is whether the bundle is still cheaper, which is
     false only once Level 3 or Level 4 is held.

     ⚠ DELETE THIS WHEN THE UPGRADE CREDIT SHIPS. Once checkout prices the
     bundle through upgradeToBundlePrice(), every route costs $997 in total
     and there is nothing to protect anyone from — the Level 2+3 buyer is
     quoted $303 and it is simply the right price. Blocking a correctly-priced
     sale at that point would be the bug. See UPGRADE_CREDIT_AT_CHECKOUT. */
  if (plan.sku === BLUEPRINT_BUNDLE.sku) {
    const { data: held } = await admin
      .from('enrollments')
      .select('level')
      .eq('user_id', ctx.userId)
      .eq('status', 'active')

    const ownedLevels = (held ?? []).map(r => r.level as number)

    if (ownedLevels.length > 0 && !bundleIsBestDeal(ownedLevels)) {
      logger.info('checkout_bundle_worse_than_remaining', {
        sku: plan.sku,
        ownedLevels,
        remaining: remainingSeparateTotal(ownedLevels),
      })
      /* 409 for the same reason as step 1: the request is well-formed, the
         world has moved on. The message names the cheaper route rather than
         just refusing — a bare "not available" reads as a fault. */
      throw new ApiError(
        409,
        'conflict',
        'You already own part of this bundle, so buying the levels you are '
        + 'missing costs less than the bundle does. Pick them up individually '
        + 'from the membership page.',
        { ownedLevels },
      )
    }
  }

  /* ── 2 · An open attempt for this plan? Return ITS session. ─────────────
     Covers the double-click, the browser refresh, the interrupted response and
     the client retry — requirements 1, 2, 3 and 4 — because all four arrive as
     a second request while the first attempt is still open.

     ⚠ RETRIEVED FROM STRIPE, NOT RECONSTRUCTED. A Checkout Session URL expires
     (we set 30 minutes), and a stale URL sends the customer to a dead page.
     Asking Stripe means we either get a usable URL or learn the session is
     gone. */
  const { data: open } = await admin
    .from('payment_references')
    .select('id, stripe_checkout_session_id, status, idempotency_key')
    .eq('user_id', ctx.userId)
    .eq('plan_id', plan.id)
    .in('status', ['pending', 'processing', 'requires_action'])
    .maybeSingle()

  if (open?.stripe_checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(open.stripe_checkout_session_id)

    /* Stripe says it is paid but our webhook has not landed yet. Do NOT send
       them back to Stripe — that is how a second charge happens. Requirement
       5: the webhook is authoritative, so we wait for it. */
    /* ══ RECONCILE ═════════════════════════════════════════════════════════
       ⚠ 0018 THREW A 409 HERE AND UPDATED NOTHING. That was wrong in a way
       that only shows up when a webhook is lost: the customer had paid, our
       row said `pending`, and every retry told them to "refresh in a moment"
       forever. Nothing in the system would ever resolve it.

       Stripe is authoritative about whether money moved. The webhook is our
       normal path, not our only one — so when we are already talking to Stripe
       and it says paid, we finish the job here.

       ⚠ IDEMPOTENT AND SAFE AGAINST THE WEBHOOK ARRIVING MID-WAY. The update
       is narrowed to open statuses, so if the webhook won the race this is a
       no-op. The grant is called regardless, because its conflict clause
       extends rather than duplicates — running it twice costs one query and
       guarantees the customer is not left without access if the webhook lands
       between our update and our grant. */
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      logger.warn('stripe_payment_reconciled', {
        paymentId: open.id,
        sessionId: session.id,
        reason: 'stripe reported paid while our record was open',
      })

      const intentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null

      await admin
        .from('payment_references')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: intentId,
        })
        .eq('id', open.id)
        .in('status', ['pending', 'processing', 'requires_action'])

      const { error: grantError } = await admin.rpc('grant_enrollments_for_payment', {
        p_payment_id: open.id,
      })

      if (grantError) {
        /* Money is taken and access is not granted. Loud, because this needs a
           person — and 503 rather than 409 so the client shows a retryable
           error instead of telling them everything is fine. */
        logger.error('reconcile_grant_failed', {
          paymentId: open.id,
          message: grantError.message,
        })
        throw new ApiError(
          503,
          'upstream_unavailable',
          'Your payment went through but access could not be set up. We are on it — contact support if this persists.',
          { paymentId: open.id },
        )
      }

      logger.info('access_granted', { paymentId: open.id, via: 'reconcile' })
      throw new ApiError(
        409,
        'conflict',
        'Your payment already went through — your access is ready.',
        { paymentId: open.id, reconciled: true },
      )
    }

    if (session.url && session.status === 'open') {
      logger.info('checkout_session_reused', { paymentId: open.id, sessionId: session.id })
      return { paymentId: open.id, url: session.url }
    }

    /* Session expired or was abandoned. Close the row so the partial unique
       index frees up and a fresh attempt can be made — requirement 7. */
    logger.info('checkout_session_stale', { paymentId: open.id, status: session.status })
    await admin.from('payment_references').update({ status: 'canceled' }).eq('id', open.id)
  } else if (open) {
    /* Row exists with no session id: the previous request died between our
       insert and Stripe's response. The Stripe idempotency key is derived from
       the row's own key, so re-creating the session below returns the SAME
       session Stripe already made rather than a second one — requirement 2. */
    logger.info('checkout_resuming_orphan', { paymentId: open.id })
    return resumeSession(ctx, plan, priceId, open.id, open.idempotency_key, input.return_path)
  }

  /* ── 3 · Derive the key. ────────────────────────────────────────────────
     Requirement 11: deterministic for the same payment operation, and NOT
     regenerated on a retry.

     The attempt counter is what keeps a genuinely failed payment from blocking
     the plan forever (requirement 7) while keeping the key stable for any one
     attempt. It advances only when an attempt reaches a terminal non-paid
     state, so a retry of the SAME attempt reuses the same key and therefore
     the same Stripe session. */
  /* ⚠ ASSIGNED BY THE DATABASE UNDER A LOCK, not counted here.

     0018 derived this as "how many closed attempts exist", recomputed per
     request. Two problems with that:

       · read-modify-write race — two concurrent callers both count the same
         number and both try to create the same attempt
       · the count is not stable. 0018's guard deliberately allows
         failed → paid, because Stripe reports a failed intent then a
         successful one when a customer corrects their card. When that happens
         the count DROPS and the next attempt derives a key that already
         exists — a spurious conflict on a legitimate purchase.

     next_payment_attempt() takes a transaction-scoped advisory lock keyed on
     (user, plan), re-checks paid and open inside it, and returns the next
     number — or 0 meaning "an attempt already exists, reuse it rather than
     creating". Checking inside the lock is what closes the window where two
     requests both decide to create attempt 1. */
  const { data: attemptNumber, error: attemptError } = await admin.rpc(
    'next_payment_attempt',
    { p_user_id: ctx.userId, p_plan_id: plan.id },
  )

  if (attemptError) {
    logger.error('attempt_assign_failed', { message: attemptError.message })
    throw new ApiError(503, 'upstream_unavailable', 'Could not start checkout. Try again.')
  }

  /* 0 = something opened or completed between our checks above and the lock.
     Rare, but it is exactly the double-click window. Tell the caller to retry;
     the next request takes the reuse path at the top. */
  if (!attemptNumber || attemptNumber === 0) {
    logger.info('payment_attempt_reused', { userId: ctx.userId, sku: plan.sku })
    throw new ApiError(
      409,
      'conflict',
      'A checkout is already in progress. Refresh and try again.',
    )
  }

  logger.info('payment_attempt_started', {
    userId: ctx.userId,
    sku: plan.sku,
    attemptNumber,
  })

  /* ⚠ DETERMINISTIC AND PERSISTED. Recomputing it is now impossible — the
     attempt number is a column, so a retry reads the same key rather than
     deriving one that may have shifted. */
  const idempotencyKey = `payment:${ctx.userId}:${plan.sku}:${attemptNumber}`

  const customerId = await ensureStripeCustomer(ctx)

  const { data: payment, error } = await admin
    .from('payment_references')
    .insert({
      user_id: ctx.userId,
      plan_id: plan.id,
      amount_cents: plan.amount_cents,
      currency: plan.currency,
      status: 'pending',
      idempotency_key: idempotencyKey,
      attempt_number: attemptNumber,
      stripe_customer_id: customerId,

      /* ⚠ WRITTEN BEFORE STRIPE IS CALLED, ON PURPOSE.

         The acknowledgement is recorded at the moment they agreed, not when
         the payment settled. If they tick the box and then abandon Stripe
         Checkout, the row stays `pending` and carries the acknowledgement —
         which is correct: they did agree, they just did not pay.

         Recording it after payment would mean a disputed charge where the
         acknowledgement is missing because the webhook failed. */
      ack_text: ack.text,
      ack_version: ack.version,
      ack_at: new Date().toISOString(),
      ack_ip: ack.ip,
      ack_user_agent: ack.userAgent,
    })
    .select('id')
    .single()

  /* ⚠ 23505 IS THE EXPECTED OUTCOME OF A RACE, NOT A FAILURE.

     Requirement 12: two simultaneous requests both pass every check above,
     then both insert. One wins; the other violates payments_one_open_per_plan
     or the idempotency index. The loser re-reads the winner's row and continues
     with it, so both callers end up on the SAME Stripe session.

     A check-then-insert cannot achieve this. The database has to be the
     arbiter. */
  if (error?.code === '23505') {
    logger.info('payment_insert_raced', { userId: ctx.userId, sku: plan.sku })
    const { data: winner } = await admin
      .from('payment_references')
      .select('id, idempotency_key')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (winner) {
      return resumeSession(ctx, plan, priceId, winner.id, winner.idempotency_key, input.return_path)
    }
    /* Raced on the open-payment index with a DIFFERENT key — another attempt
       is in flight. Tell the caller to retry rather than creating anything. */
    throw new ApiError(
      409,
      'conflict',
      'A checkout is already in progress. Refresh and try again.',
    )
  }

  if (error || !payment) {
    logger.error('payment_create_failed', { message: error?.message })
    throw new ApiError(503, 'upstream_unavailable', 'Could not start checkout. Try again.')
  }
  logger.info('payment_record_created', { paymentId: payment.id, sku: plan.sku })

  /* ── THE UPGRADE CREDIT ──────────────────────────────────────────────────
     Pricing Master, "The upgrade credit — this is what replaces the payment
     plan": "Someone buys one level and later wants the bundle. Credit the
     earlier purchase in full. You collect $997 either way rather than more.
     That is deliberate."

     ⚠ IT COLLECTS LESS, AND THAT IS THE POINT. A Level 3 owner finishing
     separately pays $991; credited, they pay $600. The doc says why: it
     "removes every reason to hesitate on a first purchase, turns each
     individual level into a low-risk door into the bundle, and gives a
     cash-constrained buyer a genuine path to all four levels without you
     financing anything." It is what replaced the instalment plan. Do not
     optimise it away without going back to that passage.

     ⚠ A COUPON, NOT A CHEAPER PRICE. The receipt then reads $997 less the
     credit — the promise kept in front of the buyer — and Stripe still reports
     every bundle sale against the one $997 price rather than four ad-hoc
     amounts nobody can group later.

     ⚠ COMPUTED FROM enrolled_levels, NEVER FROM THE REQUEST. Same rule as the
     price itself. */
  let discount: Stripe.Checkout.SessionCreateParams.Discount | undefined
  let creditCents = 0

  if (plan.sku === BLUEPRINT_BUNDLE.sku && UPGRADE_CREDIT_AT_CHECKOUT) {
    const { data: held } = await admin
      .from('enrollments')
      .select('level')
      .eq('user_id', ctx.userId)
      .eq('status', 'active')

    const owned = (held ?? []).map(r => r.level as number)

    if (owned.length > 0) {
      const credited = upgradeToBundlePrice(owned)
      const list = BLUEPRINT_BUNDLE.oneTime

      /* Unresolvable, or credited past the bundle price — {2,3,4} is $1,191
         paid against a $997 product. bundleIsBestDeal() hides the card in both
         cases, so arriving here is a stale tab or a direct request. Refuse
         rather than charge full price to somebody we promised a credit. */
      if (credited === null || list === null || credited <= 0) {
        logger.info('upgrade_credit_not_applicable', { userId: ctx.userId, owned, credited })
        throw new ApiError(
          409,
          'conflict',
          'Your existing purchases already cover most of the bundle. Buying the '
          + 'levels you are missing costs less — they are on the membership page.',
          { owned },
        )
      }

      /* ⚠ Stripe rejects charges under $0.50. The smallest credited price these
         prices can produce is $6, so this cannot fire today. It is here so a
         future price change surfaces as a refusal rather than a Stripe error
         the buyer reads. */
      if (credited < 1) {
        logger.error('upgrade_credit_below_minimum', { owned, credited })
        throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
      }

      creditCents = Math.round((list - credited) * 100)

      const coupon = await stripe.coupons.create(
        {
          amount_off: creditCents,
          currency: plan.currency.toLowerCase(),
          duration: 'once',
          name: `Upgrade credit — ${owned.length} level${owned.length > 1 ? 's' : ''} already owned`,
          max_redemptions: 1,
        },
        /* Keyed on the buyer and exactly what they own, so a retry reuses the
           same coupon rather than minting a second redeemable one. */
        { idempotencyKey: `credit:${ctx.userId}:${[...owned].sort((a, b) => a - b).join('-')}` },
      )
      discount = { coupon: coupon.id }

      await admin
        .from('payment_references')
        .update({ credit_applied_cents: creditCents })
        .eq('id', payment.id)

      logger.info('upgrade_credit_applied', {
        userId: ctx.userId,
        owned,
        creditCents,
        chargeCents: Math.round(credited * 100),
      })
    }
  }

  const origin = publicEnv.NEXT_PUBLIC_SITE_URL
  // Relative paths only — already enforced by the Zod schema, re-checked here
  // so a future caller cannot turn this into an open redirect.
  const returnPath = input.return_path.startsWith('/') ? input.return_path : '/dashboard'

  const isSubscription = plan.billing === 'subscription'

  const session = await stripe.checkout.sessions.create(
    {
      mode: isSubscription ? 'subscription' : 'payment',
      /* See PAYMENT_METHOD_TYPES at the top of this file. Card only. */
      ...(PAYMENT_METHOD_TYPES ? { payment_method_types: [...PAYMENT_METHOD_TYPES] } : {}),
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
      ...(discount ? { discounts: [discount] } : {}),
      /* ⚠ STRIPE REJECTS A SESSION CARRYING BOTH `discounts` AND
         `allow_promotion_codes`. They are mutually exclusive, so the credit
         suppresses the promo field — which is also the right behaviour:
         stacking a marketing code on top of an upgrade credit is a discount
         nobody priced. CAPABILITIES.promoCodes in config/membership.ts. */
      ...(discount ? {} : { allow_promotion_codes: true }),
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    // Stripe-level idempotency, on top of our own unique index.
    /* ⚠ THE ROW'S OWN KEY, so a retry of the same attempt gets the SAME
       Stripe session back rather than a second one. Requirements 2 and 4:
       never a new key just because the client retried. */
    { idempotencyKey },
  )

  await admin
    .from('payment_references')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', payment.id)

  if (!session.url) throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable.')
  return { paymentId: payment.id, url: session.url }
}

/* ══ RESUME AN EXISTING PAYMENT ROW ════════════════════════════════════════
   Creates or re-fetches the Stripe session for a payment row that already
   exists, using that row's stored idempotency key.

   ⚠ THIS IS WHY A RETRY CANNOT DOUBLE-CHARGE. Calling
   checkout.sessions.create with an idempotency key Stripe has already seen
   returns the ORIGINAL session — same id, same payment intent — rather than
   making a second one. So the interrupted-response case (requirement 2), the
   timeout case (requirement 4) and the insert race (requirement 12) all
   converge on one session.

   Deliberately does not re-read the plan or re-check ownership: every caller
   has already done both. Duplicating those checks here would mean two places
   to keep correct. */
async function resumeSession(
  ctx: AuthContext,
  plan: { id: string; sku: string; billing: string },
  priceId: string,
  paymentId: string,
  idempotencyKey: string,
  returnPath: string,
) {
  const customerId = await ensureStripeCustomer(ctx)
  const origin = publicEnv.NEXT_PUBLIC_SITE_URL
  const safePath = returnPath.startsWith('/') ? returnPath : '/dashboard'
  const isSubscription = plan.billing === 'subscription'

  logger.info('stripe_request_retry', { paymentId, sku: plan.sku })

  const session = await stripe.checkout.sessions.create(
    {
      mode: isSubscription ? 'subscription' : 'payment',
      /* See PAYMENT_METHOD_TYPES at the top of this file. Card only. */
      ...(PAYMENT_METHOD_TYPES ? { payment_method_types: [...PAYMENT_METHOD_TYPES] } : {}),
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: paymentId,
      metadata: { payment_id: paymentId, user_id: ctx.userId, plan_sku: plan.sku },
      payment_intent_data: isSubscription
        ? undefined
        : { metadata: { payment_id: paymentId, user_id: ctx.userId } },
      success_url: `${origin}${safePath}?checkout=success&ref=${paymentId}`,
      cancel_url: `${origin}${safePath}?checkout=canceled`,
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    { idempotencyKey },
  )

  /* Recording the session id is what lets the NEXT request take the cheap
     retrieve path instead of coming back through here. */
  await admin
    .from('payment_references')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', paymentId)

  if (!session.url) throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable.')
  logger.info('stripe_checkout_created', { paymentId, sessionId: session.id, resumed: true })
  return { paymentId, url: session.url }
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
