/* ═══════════════════════════════════════════════════════════════════════════
   THE SEVEN REGRESSION TESTS — Master Build & Launch Requirements,
   "Regression Tests — Run All Seven Before Deploy".

   The defect: purchasing Level 4 at $497 unlocked all four levels, the same
   content as the $997 bundle. $500 of leak per affected purchase. Root cause
   was not a typo — grants_cumulative defaulted to true in 0007_seed.sql, and
   grants_level is a ceiling, so "level 4, cumulative" and "the bundle" were
   indistinguishable. 0014 changed the access model, 0021 corrected the rows,
   0023 constrains them.

   ⚠ THESE GO THROUGH THE REAL GRANT PATH. Each test creates a paid
   payment_reference against a real plan and calls
   grant_enrollments_for_payment() — the same function the Stripe webhook
   calls. Asserting on hand-inserted enrollment rows would prove only that
   INSERT works; the bug lived in how a PLAN becomes enrollments, so that is
   what is exercised.

   ⚠ TEST 7 IS THE ONE THAT CATCHES A HALF-FIX. Entitlement rows can be
   perfectly correct while the content routes stay open. It reads lessons
   through an anon-key client as the buyer, so it fails if RLS disagrees with
   the enrollments table. Do not "simplify" it into another enrollments query —
   that is precisely the check it exists to avoid becoming.

   Run against LOCAL or PREVIEW. It writes and deletes rows. Never production.

     SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… \
       npx vitest run tests/entitlements.spec.ts
   ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const anonKey = process.env.SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const SKU = {
  l1: 'GWOPU-FRESHMAN',
  l2: 'GWOPU-SOPHOMORE',
  l3: 'GWOPU-JUNIOR',
  l4: 'GWOPU-SENIOR',
  bundle: 'GWOPU-BLUEPRINT-ALL',
} as const

const PASSWORD = 'test-password-1234'
const plans = new Map<string, { id: string; amount_cents: number | null }>()
const users: string[] = []

beforeAll(async () => {
  const { data, error } = await admin
    .from('membership_plans')
    .select('id, sku, amount_cents')
  if (error) throw error

  for (const p of data ?? []) plans.set(p.sku, { id: p.id, amount_cents: p.amount_cents })

  /* Fail here rather than three tests later with a foreign-key error that
     looks like a passing constraint. A database missing these rows has not
     had 0021 run against it, and nothing below would mean anything. */
  for (const sku of Object.values(SKU)) {
    if (!plans.has(sku)) {
      throw new Error(`membership_plans is missing ${sku} — run 0021 before this suite`)
    }
  }
})

afterAll(async () => {
  for (const id of users) {
    await admin.from('enrollments').delete().eq('user_id', id)
    await admin.from('memberships').delete().eq('user_id', id)
    await admin.from('payment_references').delete().eq('user_id', id)
    await admin.auth.admin.deleteUser(id)
  }
})

/** A throwaway buyer who has purchased nothing yet. */
async function buyer(tag: string) {
  const email = `ent-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  })
  if (error) throw error
  const userId = data.user!.id
  users.push(userId)
  return { userId, email }
}

/**
 * Buy a plan the way the webhook does: a paid payment row, then the grant.
 *
 * Returns the payment id, because test 6 needs it to refund exactly one
 * purchase and leave the other standing.
 */
async function purchase(userId: string, sku: string): Promise<string> {
  const plan = plans.get(sku)!
  const { data: row, error } = await admin
    .from('payment_references')
    .insert({
      user_id: userId,
      plan_id: plan.id,
      amount_cents: plan.amount_cents ?? 0,
      currency: 'usd',
      status: 'paid',
      attempt_number: 1,
      idempotency_key: `test:ent:${crypto.randomUUID()}`,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: grantError } = await admin.rpc('grant_enrollments_for_payment', {
    p_payment_id: row!.id,
  })
  if (grantError) throw grantError
  return row!.id
}

/** The levels a user actually holds, as a sorted array. */
async function activeLevels(userId: string): Promise<number[]> {
  const { data } = await admin
    .from('enrollments')
    .select('level')
    .eq('user_id', userId)
    .eq('status', 'active')
  return (data ?? []).map(r => r.level as number).sort((a, b) => a - b)
}

describe('the seven regression tests', () => {
  /* ── 1 ── The defect itself. If only one of these ever runs, run this. */
  it('1 · buying Level 4 grants level 4 and nothing else', async () => {
    const { userId } = await buyer('t1')
    await purchase(userId, SKU.l4)

    expect(
      await activeLevels(userId),
      'Level 4 granted more than level 4 — this is the $500 leak',
    ).toEqual([4])
  })

  /* ── 2 ── The other end of the ladder. Catches a fix that special-cased
     Level 4 instead of changing the model. */
  it('2 · buying Level 1 grants level 1 and nothing else', async () => {
    const { userId } = await buyer('t2')
    await purchase(userId, SKU.l1)

    expect(await activeLevels(userId)).toEqual([1])
  })

  /* ── 3 ── Surpaul's direction: no forced purchase sequence. A buyer may
     start at Level 3 without owning 1 and 2. The absence of a prerequisite
     error is the assertion — a grant that raises here breaks the funnel. */
  it('3 · buying Level 3 with no prior purchase succeeds and grants only level 3', async () => {
    const { userId } = await buyer('t3')
    await expect(purchase(userId, SKU.l3)).resolves.toBeTruthy()

    expect(await activeLevels(userId)).toEqual([3])
  })

  /* ── 4 ── The bundle is the ONLY cumulative product. If this fails while
     test 1 passes, the fix went too far and $997 now buys one level. */
  it('4 · buying the bundle grants all four levels', async () => {
    const { userId } = await buyer('t4')
    await purchase(userId, SKU.bundle)

    expect(await activeLevels(userId)).toEqual([1, 2, 3, 4])
  })

  /* ── 5 ── Non-contiguous ownership. The state a tier integer cannot
     represent at all: any "access >= N" check passes 2 here and is wrong. */
  it('5 · buying Level 1 then Level 3 grants exactly 1 and 3', async () => {
    const { userId } = await buyer('t5')
    await purchase(userId, SKU.l1)
    await purchase(userId, SKU.l3)

    const levels = await activeLevels(userId)
    expect(levels).toEqual([1, 3])
    expect(levels, 'level 2 granted by owning 1 and 3').not.toContain(2)
  })

  /* ── 6 ── A refund must revoke what was refunded and nothing more. The
     webhook revokes by payment_reference_id, so this asserts the linkage
     holds: revoking by user or by level would take Level 3 with it. */
  it('6 · refunding Level 1 leaves a separately-bought Level 3 intact', async () => {
    const { userId } = await buyer('t6')
    const l1Payment = await purchase(userId, SKU.l1)
    await purchase(userId, SKU.l3)

    /* What handleEvent does on charge.refunded when fully refunded. */
    await admin.from('payment_references').update({ status: 'refunded' }).eq('id', l1Payment)
    await admin
      .from('enrollments')
      .update({ status: 'revoked', note: 'refund:test' })
      .eq('payment_reference_id', l1Payment)
      .eq('status', 'active')

    const levels = await activeLevels(userId)
    expect(levels, 'refunding level 1 took level 3 with it').toEqual([3])
  })

  /* ── 7 ── THE HALF-FIX DETECTOR.
     Entitlements can be right in the database while the content routes stay
     open. This one signs in as the buyer with an ANON key and asks for the
     lessons directly — the path a typed URL takes. It is checking the gate,
     not the record. */
  it('7 · a Level 4 buyer cannot read Level 2 content directly', async () => {
    const { userId, email } = await buyer('t7')
    await purchase(userId, SKU.l4)

    const client = createClient(url, anonKey)
    const { error: signInError } = await client.auth.signInWithPassword({
      email, password: PASSWORD,
    })
    expect(signInError).toBeNull()

    /* By exact id, not by filter. Asking for "level 2 lessons" and getting
       none could mean RLS held or could mean the query matched nothing. */
    const { data: target } = await admin
      .from('lessons')
      .select('id')
      .eq('level', 2)
      .eq('is_preview', false)
      .limit(1)
      .single()

    const { data: leaked } = await client.from('lessons').select('id').eq('id', target!.id)
    expect(leaked ?? [], 'a Level 4 buyer read a Level 2 lesson by direct id').toHaveLength(0)

    /* And the level they did buy still opens — a gate that blocks everything
       passes the line above while being just as broken. */
    const { data: own } = await client
      .from('lessons').select('id').eq('level', 4).eq('is_preview', false).limit(1)
    expect(own ?? [], 'a Level 4 buyer cannot read their own level').not.toHaveLength(0)
  })

  /* ── 8 ── NOT ONE OF THE SEVEN. Added 2026-09-21 alongside 0024.
     The grant used to reassign payment_reference_id on conflict, so a bundle
     purchase adopted the enrollments of levels already bought separately —
     and a refund of the bundle then revoked them too. Nobody has hit it,
     because the bundle is hidden from these buyers and now refused at
     checkout, but it goes live the moment the upgrade credit ships. */
  it('8 · a later bundle purchase does not adopt separately-bought levels', async () => {
    const { userId } = await buyer('t8')
    const l2Payment = await purchase(userId, SKU.l2)
    const l3Payment = await purchase(userId, SKU.l3)
    const bundlePayment = await purchase(userId, SKU.bundle)

    expect(await activeLevels(userId)).toEqual([1, 2, 3, 4])

    const { data: rows } = await admin
      .from('enrollments')
      .select('level, payment_reference_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    const by = new Map((rows ?? []).map(r => [r.level as number, r.payment_reference_id]))

    expect(by.get(2), 'level 2 was adopted by the bundle payment').toBe(l2Payment)
    expect(by.get(3), 'level 3 was adopted by the bundle payment').toBe(l3Payment)
    /* The two the bundle genuinely bought stay with the bundle. */
    expect(by.get(1)).toBe(bundlePayment)
    expect(by.get(4)).toBe(bundlePayment)

    /* And the consequence that made it matter: refunding the bundle should
       take only what the bundle paid for. */
    await admin
      .from('enrollments')
      .update({ status: 'revoked', note: 'refund:test' })
      .eq('payment_reference_id', bundlePayment)
      .eq('status', 'active')

    expect(
      await activeLevels(userId),
      'refunding the bundle revoked separately-purchased levels',
    ).toEqual([2, 3])
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   MULTI-ITEM CHECKOUT — 0025

   These exercise the DATABASE half of a cart: several payment rows sharing one
   checkout_group_id, each granting its own level, each refundable on its own.

   ⚠ WHAT THEY DO NOT COVER. The Stripe half — session creation, line items,
   the webhook loop — needs Stripe test mode and a live webhook. Do not read a
   green run here as "carts work end to end". See APPLY-NOTES.
   ═══════════════════════════════════════════════════════════════════════════ */

describe('multi-item checkout', () => {
  /** A cart: N payment rows sharing a group, then the grant for each. */
  async function cart(userId: string, skus: string[]): Promise<{ groupId: string; ids: string[] }> {
    const groupId = crypto.randomUUID()
    const ids: string[] = []

    for (const sku of skus) {
      const plan = plans.get(sku)!
      const { data: row, error } = await admin
        .from('payment_references')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          checkout_group_id: groupId,
          amount_cents: plan.amount_cents ?? 0,
          currency: 'usd',
          status: 'paid',
          attempt_number: 1,
          idempotency_key: `cart:${groupId}:${sku}`,
          paid_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (error) throw error
      ids.push(row!.id)
    }

    for (const id of ids) {
      const { error } = await admin.rpc('grant_enrollments_for_payment', { p_payment_id: id })
      if (error) throw error
    }
    return { groupId, ids }
  }

  it('9 · a two-level cart grants exactly those two levels', async () => {
    const { userId } = await buyer('t9')
    await cart(userId, [SKU.l1, SKU.l3])

    expect(await activeLevels(userId)).toEqual([1, 3])
  })

  it('10 · each level in a cart keeps its own payment row and amount', async () => {
    const { userId } = await buyer('t10')
    const { groupId } = await cart(userId, [SKU.l1, SKU.l3])

    const { data: rows } = await admin
      .from('payment_references')
      .select('plan_id, amount_cents')
      .eq('checkout_group_id', groupId)

    /* Two rows at their own prices — never one row at a summed amount. That is
       what keeps per-level revenue reportable and a refund per level possible. */
    expect(rows).toHaveLength(2)
    expect((rows ?? []).map(r => r.amount_cents).sort((a, b) => a - b)).toEqual([19700, 39700])
  })

  it('11 · refunding one level of a cart leaves the other intact', async () => {
    const { userId } = await buyer('t11')
    const { ids } = await cart(userId, [SKU.l1, SKU.l3])

    /* Refund the first row only — what a per-level chargeback looks like. */
    await admin.from('payment_references').update({ status: 'refunded' }).eq('id', ids[0])
    await admin
      .from('enrollments')
      .update({ status: 'revoked', note: 'refund:test' })
      .eq('payment_reference_id', ids[0])
      .eq('status', 'active')

    expect(
      await activeLevels(userId),
      'refunding one cart line revoked the other',
    ).toEqual([3])
  })

  it('12 · the per-plan paid guard still holds inside a cart', async () => {
    const { userId } = await buyer('t12')
    await cart(userId, [SKU.l2])

    /* payments_one_paid_per_plan must still reject a second paid row for the
       same plan, cart or not. 0025 re-keyed the session/intent uniques; it must
       not have loosened this one. */
    const plan = plans.get(SKU.l2)!
    const { error } = await admin.from('payment_references').insert({
      user_id: userId,
      plan_id: plan.id,
      checkout_group_id: crypto.randomUUID(),
      amount_cents: plan.amount_cents ?? 0,
      currency: 'usd',
      status: 'paid',
      attempt_number: 2,
      idempotency_key: `cart:dup:${crypto.randomUUID()}`,
      paid_at: new Date().toISOString(),
    })

    expect(error, 'a second paid row for the same plan was accepted').not.toBeNull()
  })
})
