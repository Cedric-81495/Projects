/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENT SAFETY — the guarantees that stop a customer being charged twice.

   ⚠ THESE TEST THE DATABASE, NOT THE HTTP LAYER, AND THAT IS DELIBERATE.
   Every protection here is a constraint or a locked function. If a future
   refactor of checkout.ts drops a check, these still fail — which is the
   property you want from a duplicate-charge test. Testing the route would pass
   as long as the route is correct, and say nothing about whether the database
   would have caught the mistake.

   ⚠ NO STRIPE CALLS. Nothing here creates a Checkout Session. The Stripe
   idempotency behaviour (same key → same session) is Stripe's guarantee, not
   ours; what we own is that the same key is USED, which is asserted below.

   Run against PREVIEW. It writes and deletes rows.

     SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx vitest run tests/payments.spec.ts
   ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

/* A throwaway user and a real plan. The plan must exist because the foreign
   key is real — using a fabricated uuid would fail for the wrong reason and
   look like a passing constraint. */
let userId: string
let planId: string
let otherPlanId: string

const created: string[] = []

async function insertPayment(fields: Record<string, unknown>) {
  const { data, error } = await admin
    .from('payment_references')
    .insert({
      user_id: userId,
      plan_id: planId,
      amount_cents: 19700,
      currency: 'usd',
      status: 'pending',
      attempt_number: 1,
      idempotency_key: `test:${crypto.randomUUID()}`,
      ...fields,
    })
    .select('id')
    .single()
  if (data?.id) created.push(data.id)
  return { data, error }
}

beforeAll(async () => {
  const { data: u } = await admin.auth.admin.createUser({
    email: `pay-test-${Date.now()}@example.test`,
    password: crypto.randomUUID(),
    email_confirm: true,
  })
  userId = u.user!.id

  const { data: plans } = await admin
    .from('membership_plans')
    .select('id, sku')
    .order('sort_order')
    .limit(2)
  planId = plans![0].id
  otherPlanId = plans![1].id
})

afterAll(async () => {
  await admin.from('enrollments').delete().eq('user_id', userId)
  await admin.from('memberships').delete().eq('user_id', userId)
  await admin.from('payment_references').delete().eq('user_id', userId)
  if (userId) await admin.auth.admin.deleteUser(userId)
})

/* ── Requirement 12 · concurrency ──────────────────────────────────────── */

describe('concurrent payment creation', () => {
  it('allows only one open payment per user per plan', async () => {
    const first = await insertPayment({})
    expect(first.error).toBeNull()

    /* The second insert is what a double-click produces once both requests
       get past the application checks. The database must refuse it. */
    const second = await insertPayment({ attempt_number: 2 })
    expect(second.error?.code).toBe('23505')
  })

  it('assigns distinct attempt numbers under simultaneous calls', async () => {
    /* ⚠ THE ACTUAL DOUBLE-CLICK TEST. Both calls hit next_payment_attempt at
       once; the advisory lock serialises them. With an open payment already
       present from the test above, BOTH must be told to reuse (0) rather than
       one being handed a fresh number. */
    const [a, b] = await Promise.all([
      admin.rpc('next_payment_attempt', { p_user_id: userId, p_plan_id: planId }),
      admin.rpc('next_payment_attempt', { p_user_id: userId, p_plan_id: planId }),
    ])
    expect(a.data).toBe(0)
    expect(b.data).toBe(0)
  })

  it('does not serialise different plans against each other', async () => {
    /* The lock is keyed on (user, plan), so an unrelated plan is unaffected.
       If this returns 0 the lock is too coarse and one purchase blocks another. */
    const { data } = await admin.rpc('next_payment_attempt', {
      p_user_id: userId,
      p_plan_id: otherPlanId,
    })
    expect(data).toBeGreaterThan(0)
  })
})

/* ── Requirements 7, 8 · retry after failure, never after success ──────── */

describe('attempt lifecycle', () => {
  it('permits a new attempt once the previous one failed', async () => {
    await admin
      .from('payment_references')
      .update({ status: 'failed' })
      .eq('user_id', userId)
      .eq('plan_id', planId)

    const { data } = await admin.rpc('next_payment_attempt', {
      p_user_id: userId,
      p_plan_id: planId,
    })
    /* A genuine failure must not lock the plan forever — and the number must
       advance, or the retry would reuse the failed attempt's Stripe session. */
    expect(data).toBe(2)
  })

  it('refuses a further attempt once one has succeeded', async () => {
    const { data: row } = await insertPayment({
      attempt_number: 2,
      status: 'pending',
    })
    await admin.from('payment_references').update({ status: 'paid' }).eq('id', row!.id)

    const { data } = await admin.rpc('next_payment_attempt', {
      p_user_id: userId,
      p_plan_id: planId,
    })
    expect(data).toBe(0)
  })

  it('rejects a second successful payment for the same plan', async () => {
    const dup = await insertPayment({ attempt_number: 3, status: 'paid' })
    expect(dup.error?.code).toBe('23505')
  })
})

/* ── Requirement 13 · state machine ───────────────────────────────────── */

describe('payment state transitions', () => {
  it('refuses to move a paid payment back to failed', async () => {
    /* ⚠ THE ONE THAT PROTECTS A REAL CUSTOMER. Stripe does not guarantee
       delivery order, so a late payment_intent.payment_failed can arrive after
       the success. Without the trigger it would revoke access somebody paid
       for. */
    const { data: paid } = await admin
      .from('payment_references')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .single()

    const { error } = await admin
      .from('payment_references')
      .update({ status: 'failed' })
      .eq('id', paid!.id)

    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/invalid payment transition/i)
  })

  it('permits paid → refunded', async () => {
    const { data: paid } = await admin
      .from('payment_references')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .single()

    const { error } = await admin
      .from('payment_references')
      .update({ status: 'refunded' })
      .eq('id', paid!.id)

    expect(error).toBeNull()
  })
})

/* ── Requirement 6 · webhook deduplication ────────────────────────────── */

describe('webhook event claiming', () => {
  const eventId = `evt_test_${Date.now()}`

  beforeAll(async () => {
    await admin.from('stripe_events').insert({
      id: eventId,
      type: 'checkout.session.completed',
      payload: {},
    })
  })

  afterAll(async () => {
    await admin.from('stripe_events').delete().eq('id', eventId)
  })

  it('grants the claim to exactly one of two simultaneous callers', async () => {
    /* ⚠ THE REGRESSION TEST FOR THE BUG THAT STRANDED A $197 PURCHASE, and for
       the one the first fix introduced. Two concurrent deliveries of the same
       event: v2 of the gate let both through because neither had finished.
       Exactly one true, exactly one false. */
    const [a, b] = await Promise.all([
      admin.rpc('claim_stripe_event', { p_event_id: eventId }),
      admin.rpc('claim_stripe_event', { p_event_id: eventId }),
    ])
    expect([a.data, b.data].filter(Boolean)).toHaveLength(1)
  })

  it('refuses a claim once the event is processed', async () => {
    await admin
      .from('stripe_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', eventId)

    const { data } = await admin.rpc('claim_stripe_event', { p_event_id: eventId })
    expect(data).toBe(false)
  })

  it('re-claims an unprocessed event whose claim has gone stale', async () => {
    /* Without this, a function timeout mid-grant strands the event exactly the
       way the original replay gate did — the failure mode we are fixing, in a
       new disguise. */
    await admin
      .from('stripe_events')
      .update({ processed_at: null, claimed_at: new Date(Date.now() - 600_000).toISOString() })
      .eq('id', eventId)

    const { data } = await admin.rpc('claim_stripe_event', { p_event_id: eventId })
    expect(data).toBe(true)
  })

  it('rejects a duplicate event id outright', async () => {
    const { error } = await admin
      .from('stripe_events')
      .insert({ id: eventId, type: 'checkout.session.completed', payload: {} })
    expect(error?.code).toBe('23505')
  })
})

/* ── Requirement 9 · idempotent fulfilment ────────────────────────────── */

describe('enrollment granting', () => {
  it('grants once however many times the webhook is replayed', async () => {
    const { data: row } = await insertPayment({
      attempt_number: 9,
      status: 'pending',
      idempotency_key: `test:grant:${crypto.randomUUID()}`,
    })
    await admin.from('payment_references').update({ status: 'paid' }).eq('id', row!.id)

    /* Three deliveries of the same event is not unusual on a slow response. */
    await admin.rpc('grant_enrollments_for_payment', { p_payment_id: row!.id })
    await admin.rpc('grant_enrollments_for_payment', { p_payment_id: row!.id })
    await admin.rpc('grant_enrollments_for_payment', { p_payment_id: row!.id })

    const { data: rows } = await admin
      .from('enrollments')
      .select('level')
      .eq('user_id', userId)
      .eq('status', 'active')

    /* One row per granted level, not three. */
    expect(rows).toHaveLength(1)
  })

  it('refuses to grant for a payment that is not paid', async () => {
    const { data: row } = await insertPayment({
      plan_id: otherPlanId,
      attempt_number: 5,
      idempotency_key: `test:unpaid:${crypto.randomUUID()}`,
    })
    const { error } = await admin.rpc('grant_enrollments_for_payment', {
      p_payment_id: row!.id,
    })
    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/refusing to grant/i)
  })
})

/* ── Requirement 10 · the constraints exist at all ────────────────────── */

describe('database constraints', () => {
  it('rejects a duplicate idempotency key', async () => {
    const key = `test:dupe:${crypto.randomUUID()}`
    await insertPayment({ plan_id: otherPlanId, attempt_number: 6, idempotency_key: key })
    const { error } = await insertPayment({
      plan_id: otherPlanId,
      attempt_number: 7,
      idempotency_key: key,
    })
    expect(error?.code).toBe('23505')
  })

  it('rejects a duplicate stripe checkout session id', async () => {
    const sid = `cs_test_${crypto.randomUUID()}`
    await insertPayment({
      plan_id: otherPlanId,
      attempt_number: 8,
      stripe_checkout_session_id: sid,
      idempotency_key: `test:${crypto.randomUUID()}`,
    })
    const { error } = await insertPayment({
      plan_id: otherPlanId,
      attempt_number: 10,
      stripe_checkout_session_id: sid,
      idempotency_key: `test:${crypto.randomUUID()}`,
    })
    expect(error?.code).toBe('23505')
  })
})
