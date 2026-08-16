/**
 * Creates TEST-MODE Stripe products and prices, then writes the price IDs into
 * `membership_plans` so checkout works end to end locally.
 *
 * ⚠ TEST MODE ONLY. Refuses to run against a live key, and refuses to run
 *   against a database flagged as production. Real pricing is Surpaul's
 *   decision — the amounts below are placeholders for exercising the payment
 *   path and must never be quoted to anyone or copied into production.
 *
 *   pnpm tsx scripts/seed-stripe.ts
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

/** Placeholder amounts. NOT approved pricing. */
const PLANS = [
  { sku: 'GWOPU-FRESHMAN',      name: 'Freshman',  level: 1, cents:  9700 },
  { sku: 'GWOPU-SOPHOMORE',     name: 'Sophomore', level: 2, cents: 19700 },
  { sku: 'GWOPU-JUNIOR',        name: 'Junior',    level: 3, cents: 29700 },
  { sku: 'GWOPU-SENIOR',        name: 'Senior',    level: 4, cents: 39700 },
  { sku: 'GWOPU-BLUEPRINT-ALL', name: 'The Complete GWOP Blueprint', level: 4, cents: 79700 },
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

console.log('\nDone. These are TEST prices. Do not quote them to anyone.')
