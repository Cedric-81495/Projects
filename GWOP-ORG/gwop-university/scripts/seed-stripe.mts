/**
 * Creates TEST-MODE Stripe products and prices, then writes the price IDs into
 * `membership_plans` so checkout works end to end locally.
 *
 * ⚠ TEST MODE ONLY. Refuses to run against a live key.
 *
 * ⚠ AMOUNTS ARE NOW SURPAUL'S APPROVED PRICING, not placeholders — updated
 *   2026-09-10 from his final-direction memo §1. The prices below are the ones
 *   the funnel already displays, so a test purchase exercises the real numbers
 *   and the receipt reads correctly.
 *
 *   Level 1  $197   Level 2  $297   Level 3  $397   Level 4  $497
 *   All four bundle  $997        (instalment plan is not seeded — see below)
 *
 * ⚠ SETS published = true. That makes the plans visible and buyable on
 *   /membership. With a sk_test_ key Stripe accepts only test cards, so no real
 *   money can move — but a visitor who finds the page could complete a test
 *   purchase and receive real enrollments. /membership is noindexed and linked
 *   only from inside the portal, so exposure is low. Unpublish when the test is
 *   done if you want it closed again:
 *
 *     update public.membership_plans set published = false;
 *
 * ⚠ NO INSTALMENT PLAN. All five rows stay billing = 'one_time'. The 3 x $397
 *   option is a subscription with a three-cycle limit and access pausing on a
 *   failed payment — none of which is built. Seeding it as a subscription would
 *   make a half-working plan buyable.
 *
 *   npm run seed:stripe
 */
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const secret = process.env.STRIPE_SECRET_KEY ?? ''
if (!secret.startsWith('sk_test_')) {
  throw new Error('Refusing to run: STRIPE_SECRET_KEY must be a sk_test_ key.')
}
if (process.env.APP_ENVIRONMENT === 'production') {
  throw new Error('Refusing to run against production.')
}

// No apiVersion: the installed SDK pins its own matching version. Hardcoding
// a stale string is a compile error at best and a silent payload-shape change
// at worst.
const stripe = new Stripe(secret)
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

/* Surpaul's approved pricing, memo §1. These are the amounts the funnel
   already renders, so they must match config/membership.ts exactly — a
   difference between what the page quotes and what Stripe charges is the worst
   kind of bug, because the customer sees it and we do not.

   `name` matches the level titles from content/pathway.ts rather than the old
   academic names, so the Stripe dashboard and the customer's receipt read the
   same as the website. */
const PLANS = [
  { sku: 'GWOPU-FRESHMAN',      name: 'Level 1 — Personal Credit',                        level: 1, cents: 19700 },
  { sku: 'GWOPU-SOPHOMORE',     name: 'Level 2 — Business Foundation & Business Credit',   level: 2, cents: 29700 },
  { sku: 'GWOPU-JUNIOR',        name: 'Level 3 — Funding & Banking Strategy',              level: 3, cents: 39700 },
  { sku: 'GWOPU-SENIOR',        name: 'Level 4 — Execution, Capital & Wealth Strategy',    level: 4, cents: 49700 },
  { sku: 'GWOPU-BLUEPRINT-ALL', name: 'GWOP University — All 4 Levels',                    level: 4, cents: 99700 },
]

for (const plan of PLANS) {
  // Idempotent: re-running reuses the product rather than creating duplicates
  // that then compete in the Stripe dashboard.
  const existing = await stripe.products.search({ query: `metadata['sku']:'${plan.sku}'` })

  const product =
    existing.data[0] ??
    (await stripe.products.create({
      name: `GWOP University · ${plan.name}`,
      metadata: { sku: plan.sku, grants_level: String(plan.level) },
    }))

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.cents,
    currency: 'usd',
    metadata: { sku: plan.sku },
  })

  const { error } = await db
    .from('membership_plans')
    .update({
      stripe_price_id_test: price.id,
      amount_cents: plan.cents,
      published: true, // dev/staging only — mirrors PRICING_PUBLISHED going true
    })
    .eq('sku', plan.sku)

  if (error) throw new Error(`${plan.sku}: ${error.message}`)
  console.log(`✓ ${plan.sku.padEnd(22)} ${price.id}  $${(plan.cents / 100).toFixed(2)}`)
}

console.log('\nDone. Approved amounts, TEST-mode prices.')
console.log('Stripe will accept only test cards — 4242 4242 4242 4242 succeeds,')
console.log('4000 0000 0000 0002 declines. No real card can be charged.')
console.log('\nTo close /membership again:')
console.log("  update public.membership_plans set published = false;")