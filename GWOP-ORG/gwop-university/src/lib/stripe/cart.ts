import 'server-only'
import type Stripe from 'stripe'
import { randomUUID } from 'node:crypto'
import { stripe, priceIdFor } from '@/lib/stripe/client'
import { admin } from '@/lib/supabase/admin'
import { ApiError } from '@/lib/http/errors'
import { logger } from '@/lib/observability/logger'
import type { AuthContext } from '@/lib/auth/context'
import {
  BLUEPRINT_BUNDLE, BNPL_ALLOWED, fmtMoney,
  UPGRADE_CREDIT_AT_CHECKOUT, upgradeToBundlePrice,
} from '@/config/membership'
import { env, publicEnv } from '@/lib/env'
// publicEnv is re-exported from lib/env, same source the single path uses

/* ═══════════════════════════════════════════════════════════════════════════
   MULTI-ITEM CHECKOUT — several levels, one session, one charge

   ⚠ WHY THIS IS A SEPARATE FILE AND NOT AN EXTENSION OF checkout.ts.
   The single-plan flow in lib/stripe/checkout.ts is hardened across three
   migrations — 0018 exists because a real double charge happened, 0019 because
   the attempt counter raced, 0024 because a later payment adopted an earlier
   one's enrollments. It works. Rewriting it to take an array would put every
   one of those fixes back in play for a feature none of them were written for.

   So: ONE selected level routes through the existing function, byte-identical.
   Two or more come here. A single purchase cannot regress.

   ── WHAT A CART IS, EXACTLY ───────────────────────────────────────────────
   Not a new product. A cart is N independent single-plan purchases that share
   a Stripe session, and every per-plan guarantee still applies to each of
   them individually:

     · its own membership_plans row and its own price ID — no summed
       price_data, because that would erase per-level revenue reporting and
       hand the buyer a receipt naming nothing
     · its own payment_references row, at its own amount
     · its own enrollment, granted by the same grant_enrollments_for_payment()
       the single path uses, called once per row
     · payments_one_open_per_plan and payments_one_paid_per_plan still stop a
       level being bought twice, cart or not
     · a refund of one level revokes only that level (0024)

   The only thing shared is checkout_group_id and the Stripe session.

   ⚠ THE BUNDLE IS NEVER A CART ITEM. It is a distinct SKU with
   grants_cumulative, protected by 0023's constraint. Selecting four levels
   does not build a bundle — it gets refused, with the bundle offered instead.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CartResult {
  groupId: string
  paymentIds: string[]
  url: string
}

interface PlanRow {
  id: string
  sku: string
  name: string
  amount_cents: number | null
  currency: string
  billing: string
  grants_level: number
  stripe_price_id_test: string | null
  stripe_price_id_live: string | null
}

export async function createCartCheckoutSession(
  ctx: AuthContext,
  input: { plan_skus: string[]; return_path: string },
  ack: { text: string; version: string; ip: string | null; userAgent: string | null },
): Promise<CartResult> {
  const requested = [...new Set(input.plan_skus)]

  /* ── 1 · Resolve the plans ───────────────────────────────────────────────
     ⚠ BY SKU, AND THE CLIENT SENDS NOTHING ELSE. No amount, no total, no
     price id. Same rule as the single path: a client that can name its own
     price will eventually name $1. Every figure below comes from these rows. */
  const { data: plans, error } = await admin
    .from('membership_plans')
    .select('id, sku, name, amount_cents, currency, billing, grants_level, stripe_price_id_test, stripe_price_id_live')
    .in('sku', requested)
    .eq('published', true)

  if (error) {
    logger.error('cart_plan_lookup_failed', { message: error.message })
    throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
  }

  const rows = (plans ?? []) as PlanRow[]

  if (rows.length !== requested.length) {
    const found = new Set(rows.map(p => p.sku))
    throw new ApiError(400, 'validation_failed', 'One of the selected levels is unavailable.', {
      missing: requested.filter(s => !found.has(s)),
    })
  }

  /* ⚠ THE BUNDLE CANNOT BE A LINE ITEM. It grants cumulatively, so pairing it
     with a level would grant that level twice and bill for it twice. Anyone
     who wants the bundle buys the bundle, through the single-item path. */
  if (rows.some(p => p.sku === BLUEPRINT_BUNDLE.sku)) {
    throw new ApiError(400, 'validation_failed', 'The bundle is bought on its own, not alongside levels.')
  }

  /* Belt and braces with the single path's guard: a plan row edited by hand in
     the dashboard is the case neither config nor migrations can prevent. */
  const notOneTime = rows.find(p => p.billing !== 'one_time')
  if (notOneTime) {
    logger.error('cart_plan_billing_not_one_time', { sku: notOneTime.sku, billing: notOneTime.billing })
    throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
  }

  /* ── 2 · Drop what they already own ──────────────────────────────────────
     ⚠ SILENTLY, NOT AS AN ERROR. A stale tab, a back button, a level bought in
     another window — all produce a selection containing something already
     owned, and none of them are the buyer's fault. Charging for it would be
     the worst outcome; a hard error that loses the rest of the cart is the
     second worst. Removing it and charging for the remainder is right.

     payments_one_paid_per_plan would reject the duplicate row anyway. This is
     so the buyer never sees that rejection. */
  const { data: held } = await admin
    .from('enrollments')
    .select('level')
    .eq('user_id', ctx.userId)
    .eq('status', 'active')

  const ownedLevels = new Set((held ?? []).map(r => r.level as number))
  const buying = rows.filter(p => !ownedLevels.has(p.grants_level))
  const dropped = rows.filter(p => ownedLevels.has(p.grants_level)).map(p => p.sku)

  if (dropped.length > 0) {
    logger.info('cart_dropped_owned', { userId: ctx.userId, dropped })
  }

  if (buying.length === 0) {
    throw new ApiError(409, 'conflict', 'You already own everything you selected.', { dropped })
  }

  /* Every price must be resolvable before anything is written. A missing
     amount or price ID mid-cart would mean a partial purchase. */
  const missingPrice = buying.find(p => p.amount_cents === null || !priceIdFor(p))
  if (missingPrice) {
    logger.error('cart_plan_missing_stripe_price', { sku: missingPrice.sku, mode: env.STRIPE_MODE })
    throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
  }

  const total = buying.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0)

  /* ── 3 · If the bundle is cheaper, refuse and say so ─────────────────────
     ⚠ SERVER-SIDE, NOT JUST A PROMPT IN THE UI. The membership page shows the
     same message when the fourth box is ticked, but a hidden or dismissed
     prompt is not a guard — this is the one that holds for a stale tab or a
     scripted request.

     Selling four levels at $1,388 when the same content is $997 on the next
     card is the single most legible way to lose a customer's trust. It reads
     as a trap whether or not it was one.

     Ties go to the bundle: equal price, more convenient, and it is the product
     being promoted. */
  /* ⚠ AGAINST THE CREDITED PRICE, NOT THE LIST PRICE — 2026-09-21. A buyer who
     already owns a level is not choosing between this selection and $997; they
     are choosing between it and whatever the credit leaves. Quoting $997 here
     would tell somebody the bundle costs more than it would actually charge
     them, which is the same defect in reverse. upgradeToBundlePrice() returns
     the list price when they own nothing. */
  const bundlePrice = UPGRADE_CREDIT_AT_CHECKOUT
    ? upgradeToBundlePrice(ownedLevels.size > 0 ? [...ownedLevels] : [])
    : BLUEPRINT_BUNDLE.oneTime
  const bundleCents = Math.round((bundlePrice ?? 0) * 100)

  if (bundleCents > 0 && total >= bundleCents) {
    logger.info('cart_bundle_is_cheaper', {
      userId: ctx.userId,
      skus: buying.map(p => p.sku),
      totalCents: total,
      bundleCents,
    })
    throw new ApiError(
      409,
      'conflict',
      `All four levels together are ${fmtMoney(bundlePrice ?? 0)} — `
      + `${fmtMoney((total - bundleCents) / 100)} less than buying these separately. `
      + 'Choose the complete Blueprint instead.',
      { offerBundle: true, bundleSku: BLUEPRINT_BUNDLE.sku, selectedTotalCents: total, bundleCents },
    )
  }

  /* ── 4 · An open attempt on any of these levels ──────────────────────────
     ⚠ THIS USED TO REFUSE, AND THAT WAS A DEAD END — corrected 2026-09-21
     after testing. The message said "finish or cancel that one first", and
     there is nothing in the product that cancels a checkout. A buyer who
     opened a cart and pressed Back could never buy those levels again until
     the Stripe session expired on its own. Worse than the bug it guarded
     against.

     The single path resumes. So does this one now, with one extra case: the
     open rows may belong to a DIFFERENT selection than the one in front of us.

     ⚠ EXPIRE AT STRIPE BEFORE CANCELLING A ROW. This is the part that must not
     be simplified. A row marked `canceled` while its Stripe session is still
     open is a live payment link pointing at a record that no longer expects
     money: the customer pays, the webhook's status guard is narrowed to open
     states, the update no-ops, and they are charged with no access. Expiring
     the session first makes that impossible — an expired session cannot be
     paid. */
  const { data: openRows } = await admin
    .from('payment_references')
    .select('id, plan_id, checkout_group_id, stripe_checkout_session_id')
    .eq('user_id', ctx.userId)
    .in('plan_id', buying.map(p => p.id))
    .in('status', ['pending', 'processing', 'requires_action'])

  if (openRows && openRows.length > 0) {
    /* Does one existing cart match this selection exactly? If so it is the
       same purchase being retried, and Stripe's own session is the right
       thing to hand back. */
    const groupIds = [...new Set(openRows.map(r => r.checkout_group_id).filter(Boolean))] as string[]

    if (groupIds.length === 1 && openRows.every(r => r.checkout_group_id === groupIds[0])) {
      const { data: groupRows } = await admin
        .from('payment_references')
        .select('plan_id, stripe_checkout_session_id')
        .eq('checkout_group_id', groupIds[0])
        .in('status', ['pending', 'processing', 'requires_action'])

      const groupPlans = new Set((groupRows ?? []).map(r => r.plan_id))
      const sameSelection =
        groupPlans.size === buying.length && buying.every(p => groupPlans.has(p.id))
      const sessionId = groupRows?.find(r => r.stripe_checkout_session_id)?.stripe_checkout_session_id

      if (sameSelection && sessionId) {
        try {
          const existing = await stripe.checkout.sessions.retrieve(sessionId)
          if (existing.status === 'open' && existing.url) {
            logger.info('cart_session_reused', { groupId: groupIds[0], sessionId })
            return {
              groupId: groupIds[0],
              paymentIds: openRows.map(r => r.id),
              url: existing.url,
            }
          }
        } catch (e) {
          logger.warn('cart_session_retrieve_failed', {
            sessionId,
            message: e instanceof Error ? e.message : 'unknown',
          })
        }
      }
    }

    /* Either a different selection, or a session that is no longer open.
       Clear the way — expiring first, one session at a time. */
    const seen = new Set<string>()
    for (const row of openRows) {
      const sid = row.stripe_checkout_session_id
      if (sid && !seen.has(sid)) {
        seen.add(sid)
        try {
          const s = await stripe.checkout.sessions.retrieve(sid)
          if (s.status === 'open') await stripe.checkout.sessions.expire(sid)
        } catch (e) {
          /* ⚠ ABORT RATHER THAN CANCEL BLIND. If Stripe cannot be reached we do
             not know whether that session is still payable, and cancelling the
             row on a guess is exactly the charge-without-access case above. */
          logger.error('cart_expire_failed', {
            sessionId: sid,
            message: e instanceof Error ? e.message : 'unknown',
          })
          throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
        }
      }
    }

    const { error: cancelError } = await admin
      .from('payment_references')
      .update({ status: 'canceled' })
      .in('id', openRows.map(r => r.id))
      .in('status', ['pending', 'processing', 'requires_action'])

    if (cancelError) {
      logger.error('cart_cancel_stale_failed', { message: cancelError.message })
      throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
    }

    logger.info('cart_cleared_stale_attempts', { count: openRows.length })
  }

  /* ── 5 · Claim an attempt for each plan ──────────────────────────────────
     ⚠ SORTED BY plan_id, AND THAT IS NOT COSMETIC. next_payment_attempt()
     takes a per-(user, plan) advisory lock. Two carts overlapping on two
     plans, each locking in its own order, is a textbook deadlock: A holds
     plan 1 wanting plan 2 while B holds plan 2 wanting plan 1. A consistent
     global order makes that impossible — the second caller simply waits.

     ⚠ SEQUENTIAL, NOT Promise.all, for the same reason. Concurrent calls
     inside one request would defeat the ordering.

     A 0 here now means a race: another request claimed the plan between our
     clear-out above and this call. Rare, and retrying is the right answer. */
  const ordered = [...buying].sort((a, b) => a.id.localeCompare(b.id))
  const attempts = new Map<string, number>()

  for (const plan of ordered) {
    const { data: attempt, error: attemptError } = await admin.rpc('next_payment_attempt', {
      p_user_id: ctx.userId,
      p_plan_id: plan.id,
    })
    if (attemptError) {
      logger.error('cart_attempt_failed', { sku: plan.sku, message: attemptError.message })
      throw new ApiError(503, 'upstream_unavailable', 'Checkout is unavailable right now.')
    }
    if (!attempt || attempt === 0) {
      logger.warn('cart_attempt_raced', { userId: ctx.userId, sku: plan.sku })
      throw new ApiError(
        409,
        'conflict',
        'Another checkout started at the same moment. Please try again.',
        { sku: plan.sku },
      )
    }
    attempts.set(plan.id, attempt as number)
  }

  /* ── 6 · Write the rows BEFORE calling Stripe ────────────────────────────
     ⚠ THIS ORDER IS DELIBERATE and matches the single path. Rows first means a
     crash between here and Stripe leaves recoverable state; Stripe first would
     mean a session nothing in our database knows about.

     The group id is generated here rather than taken from Stripe, because it
     has to exist before the session does — which is exactly why 0025 adds a
     column instead of grouping on stripe_checkout_session_id.

     ⚠ ONE INSERT, NOT A LOOP. Supabase applies this as a single statement, so
     a unique-index rejection on any row rolls back all of them. A partial cart
     in the database is the state with no good recovery. */
  const groupId = randomUUID()

  const { data: inserted, error: insertError } = await admin
    .from('payment_references')
    .insert(
      buying.map(plan => ({
        user_id: ctx.userId,
        plan_id: plan.id,
        checkout_group_id: groupId,
        amount_cents: plan.amount_cents ?? 0,
        currency: plan.currency,
        status: 'pending' as const,
        attempt_number: attempts.get(plan.id)!,
        /* Deterministic and per-plan: the group makes it unique across carts,
           the sku makes it unique within one. A retry of the same cart derives
           the same keys and Stripe returns the same session. */
        idempotency_key: `cart:${groupId}:${plan.sku}`,

        /* ⚠ ON EVERY ROW, NOT ONCE PER CART. The acknowledgement is the record
           that this buyer accepted these terms before paying, and it is
           evidence in a chargeback. Chargebacks arrive per level — a refund
           revokes one enrollment, not a basket — so the evidence has to sit on
           the row being disputed. One shared record would leave three of four
           levels with nothing to show.

           Recorded now, at the moment of agreement, not when the webhook
           lands: if they abandon Checkout the row stays pending and still
           carries the acknowledgement, which is the honest sequence. */
        ack_text: ack.text,
        ack_version: ack.version,
        ack_at: new Date().toISOString(),
        ack_ip: ack.ip,
        ack_user_agent: ack.userAgent,
      })),
    )
    .select('id, plan_id')

  if (insertError || !inserted) {
    logger.error('cart_insert_failed', { message: insertError?.message, groupId })
    throw new ApiError(503, 'upstream_unavailable', 'Checkout could not be started.')
  }

  /* ── 7 · One session, one line item per level ────────────────────────────
     ⚠ SEPARATE LINE ITEMS, NEVER A SUMMED price_data. Each level keeps its own
     Stripe price, so the receipt names what was bought and Stripe reporting
     still attributes revenue per level. A single merged amount would be a
     figure nobody can break down afterwards.

     ⚠ NO allow_promotion_codes HERE. The single path enables it; a cart plus a
     promotion code is an interaction nobody has priced, and it would apply to
     the whole basket rather than a chosen level. */
  const origin = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const returnPath = input.return_path.startsWith('/') ? input.return_path : '/dashboard'

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        ...(BNPL_ALLOWED ? {} : { payment_method_types: ['card'] as const }),
        customer_email: ctx.email ?? undefined,
        line_items: buying.map(plan => ({ price: priceIdFor(plan)!, quantity: 1 })),
        client_reference_id: groupId,
        metadata: {
          /* ⚠ THE WEBHOOK BRANCHES ON THIS. Without `kind`, a cart session
             looks like a single purchase whose payment_id happens to be a
             group id, and the lookup finds nothing. */
          kind: 'cart',
          checkout_group_id: groupId,
          user_id: ctx.userId,
          plan_skus: buying.map(p => p.sku).join(','),
        },
        payment_intent_data: {
          metadata: { kind: 'cart', checkout_group_id: groupId, user_id: ctx.userId },
        },
        success_url: `${origin}${returnPath}?checkout=success&group=${groupId}`,
        cancel_url: `${origin}${returnPath}?checkout=canceled`,
      },
      /* Stripe's own idempotency, keyed on the group: a retried request returns
         the session already created rather than a second one. */
      { idempotencyKey: `cart-session:${groupId}` },
    )
  } catch (stripeError) {
    /* ⚠ CLOSE THE ROWS. Left pending they hold payments_one_open_per_plan and
       block every future attempt on those levels — the buyer would be unable
       to purchase anything they had selected. */
    await admin
      .from('payment_references')
      .update({ status: 'canceled' })
      .eq('checkout_group_id', groupId)

    logger.error('cart_session_create_failed', {
      groupId,
      message: stripeError instanceof Error ? stripeError.message : 'unknown',
    })
    throw new ApiError(503, 'upstream_unavailable', 'Checkout could not be started.')
  }

  await admin
    .from('payment_references')
    .update({ stripe_checkout_session_id: session.id })
    .eq('checkout_group_id', groupId)

  if (!session.url) {
    logger.error('cart_session_no_url', { groupId, sessionId: session.id })
    throw new ApiError(503, 'upstream_unavailable', 'Checkout could not be started.')
  }

  logger.info('cart_checkout_created', {
    groupId,
    sessionId: session.id,
    skus: buying.map(p => p.sku),
    totalCents: total,
  })

  return { groupId, paymentIds: inserted.map(r => r.id), url: session.url }
}
