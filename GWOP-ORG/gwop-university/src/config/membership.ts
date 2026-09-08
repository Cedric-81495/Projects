/* ═══════════════════════════════════════════════════════════════════════════
   MEMBERSHIP + PRICING  —  OWNER: SURPAUL (approves) · FELICIA (defines)
   Source: Felicia's confirmed directions, Aug 14 — §1 Pricing + Membership
   Structure, §9 Event Incentive, §10 Account Creation + Payment.
   Amounts: Surpaul's final-direction memo (CEDRIC SIDE §1).

   Felicia's requirement, verbatim: "Please build the system so pricing can be
   changed easily without redesigning the website/app."

   That is what this file is. Every price, billing mode, promo and offer is a
   value here. To change pricing: edit this file, deploy. No layout work, no
   new components, no design review. Nothing in the funnel hardcodes a number —
   every price on the page comes through priceLabel() below.

   ═══ 2026-09-07 · PRICING TURNED ON FOR DISPLAY ═══════════════════════════
   PRICING_PUBLISHED was false and every amount was null. Both changed, because
   Surpaul's memo states the amounts and the approved funnel layout renders
   them:

     Level 1 — Personal Credit                              $197 one-time
     Level 2 — Business Foundation & Business Credit        $297 one-time
     Level 3 — Funding & Banking Strategy                   $397 one-time
     Level 4 — Execution, Capital & Wealth Strategy         $497 one-time
     All four separately                                  $1,388
     GWOP University — All 4 Levels                         $997 one-time
     Payment plan                            3 × $397  (total $1,191)

   ⚠ DISPLAY IS NOT THE SAME THING AS CHECKOUT. Read this before telling
   anybody they can buy.

   Nothing on this page can take a payment yet, and that is enforced in three
   independent places, none of which this file controls:

     1. All five rows in `membership_plans` have published = false and
        amount_cents = null. The DB constraint `plans_publishable` refuses to
        publish a plan with no amount AND no Stripe price ID to charge against.
     2. STRIPE_MODE is `test`.
     3. /api/v1/checkout is declared `auth: 'student'` — a visitor with no
        account cannot reach it at all.

   So the page states Surpaul's approved prices and every CTA points at the
   free assessment, which is exactly what the approved layout does. To actually
   sell: run scripts/seed-stripe.ts, write amount_cents and the price IDs into
   membership_plans, set published = true, switch STRIPE_MODE to live, and
   build signup → checkout. Until then the buttons are honest — they lead to
   the Blueprint, not to a card form.

   ⚠ AND FIX THE ENTITLEMENT FIRST. In 0007_seed.sql, GWOPU-SENIOR and
   GWOPU-BLUEPRINT-ALL both carry grants_level = 4 with grants_cumulative =
   true — identical access. Level 4 at $497 unlocks everything the $997 bundle
   unlocks, so the bundle is irrational to buy and the "$1,388 separately"
   framing does not hold. Set grants_cumulative = false on the four individual
   levels. This is compatible with Surpaul's memo: he ruled out a forced
   PURCHASE sequence, which is about buying order, not about access stacking.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Master gate. While false: cards show `tbdLabel`, never a number. */
export const PRICING_PUBLISHED = true

/** Felicia §1: "Currency: USD." */
export const CURRENCY = { code: 'USD', symbol: '$' } as const

/* ── THE FOUR LEVELS ───────────────────────────────────────────────────────
   `slug` matches src/content/pathway.ts — do not rename, routes depend on it.
   `sku` is what the payment component and GHL key membership access on
   (§10: "membership access based on the level/product purchased").
   ────────────────────────────────────────────────────────────────────────── */
export const LEVELS = [
  { slug: 'freshman',  sku: 'GWOPU-FRESHMAN',  order: 1,
    oneTime: 197 as number | null, monthly: null as number | null },
  { slug: 'sophomore', sku: 'GWOPU-SOPHOMORE', order: 2,
    oneTime: 297 as number | null, monthly: null as number | null },
  { slug: 'junior',    sku: 'GWOPU-JUNIOR',    order: 3,
    oneTime: 397 as number | null, monthly: null as number | null },
  { slug: 'senior',    sku: 'GWOPU-SENIOR',    order: 4,
    oneTime: 497 as number | null, monthly: null as number | null },
] as const

/* ── THE BUNDLE ────────────────────────────────────────────────────────────
   Surpaul's memo: "That should be positioned as the primary offer."

   `planMonths` × `monthly` is the payment plan. Note the plan total ($1,191)
   is higher than the one-time price ($997) — that is intentional and standard,
   and the funnel states both numbers so nobody discovers it at checkout.

   Access on the plan follows payment status: "People on the payment plan
   receive access according to their payment status. If payments stop, access
   pauses." That is subscription logic, and it is NOT built yet — see
   `subscriptions` in 0004_commerce.sql for the table it will use.
   ────────────────────────────────────────────────────────────────────────── */
export const BLUEPRINT_BUNDLE = {
  sku: 'GWOPU-BLUEPRINT-ALL',
  oneTime: 997 as number | null,
  monthly: 397 as number | null,
  planMonths: 3,
} as const

/* ── WHAT THE PLATFORM MUST SUPPORT (Felicia §1) ───────────────────────────
   Flags, not features. Each one is off until the business decides to activate
   it. They exist here so the answer to "can the system do X?" is a one-line
   change instead of a rebuild.
   ────────────────────────────────────────────────────────────────────────── */
export const CAPABILITIES = {
  individualLevelAccess: true,   // buy a single level
  upgradeToHigherLevel:  true,   // Level 1 → 2 etc., credit prior spend
  promoCodes:            true,   // discount codes
  eventOffers:           true,   // activation-specific pricing
  foundingMember:        true,   // §9
  scholarshipGiveaway:   true,   // §9
  oneTimePayment:        true,
  monthlyPayment:        true,
} as const

/* ── OFFERS ────────────────────────────────────────────────────────────────
   Felicia §9: "Please build the structure now using editable placeholders
   rather than waiting for final promotional wording."
   `approved: false` = wording is a placeholder; DRAFT mode highlights it and
   it must not appear in print or paid ads.
   ────────────────────────────────────────────────────────────────────────── */
export const OFFERS = {
  eventBlueprint: {
    id: 'EVENT-BLUEPRINT-0830',
    label: 'Free GWOP Wealth Blueprint',
    priceOverride: 0,
    approved: false,
  },
  foundingMember: {
    id: 'FOUNDING-MEMBER',
    label: 'Founding Member Access',
    priceOverride: null as number | null,
    seatLimit: null as number | null,
    /* Surpaul's memo defines the window: anyone registered at the 8/30 launch
       event qualifies automatically, new eligibility closes 2026-09-30, status
       does not expire, and it does NOT mean future products are free. The
       benefit wording itself is still not written, so this stays false. */
    windowOpens: '2026-08-30',
    windowCloses: '2026-09-30',
    approved: false,
  },
  scholarship: {
    id: 'SCHOLARSHIP-0830',
    label: 'Scholarship / Giveaway',
    /* ⚠ STILL UNDEFINED, AND THERE IS AN OUTSTANDING PROMISE. Nobody has said
       what the scholarship is worth, who draws it, when, or how a winner is
       told — but at least one person signed up on event day under wording that
       entered them into it. Never invent giveaway terms. */
    rules: null as string | null,
    approved: false,
  },
} as const

/* ── PROMO CODES ───────────────────────────────────────────────────────────
   Declared here, enforced by the payment component (§10). The website never
   validates a code itself — no discount logic in the front end, ever.
   ────────────────────────────────────────────────────────────────────────── */
export const PROMO_CODES: Array<{
  code: string
  kind: 'percent' | 'amount'
  value: number
  appliesTo: string[]
  expires: string | null
  approved: boolean
}> = [
  // Example shape, inactive. Surpaul approves before any code goes live.
  // { code: 'EGE830', kind: 'percent', value: 20,
  //   appliesTo: ['GWOPU-FRESHMAN'], expires: '2026-09-30', approved: false },
]

/* ── REFUND / CANCELLATION ─────────────────────────────────────────────────
   ⚠ READ BEFORE EDITING. THIS IS THE MOST EXPOSED STRING IN THE REPO.

   The approved funnel layout renders "No refunds once purchased — know what
   you're getting before you buy." in the bundle card, and states it again in
   the FAQ. So the sentence is here, and both surfaces plus /refunds now read
   from this one value — a refund policy stated in three places from three
   sources is a policy that will eventually contradict itself, and a
   contradiction is worse than either version.

   ⚠ `approved` IS STILL FALSE, ON PURPOSE. Surpaul's final-direction memo
   records this as "REFUND POLICY - no refund (TBD)". TBD is his word. Felicia's
   §1 is explicit: "Do not publish a final policy until approved." While
   `approved` is false the string still renders on the funnel — because the
   approved layout renders it — but it goes through <Tbc>, so DRAFT mode flags
   it, and /refunds continues to say no policy is in force rather than
   publishing an unapproved one.

   A no-refund position on a digital product sold to consumers is a decision an
   attorney should sign, not a copy choice. Some card networks and some state
   rules do not care what the page says. Flip `approved` when somebody
   qualified has said the words, and not before.
   ────────────────────────────────────────────────────────────────────────── */
export const REFUND_POLICY = {
  text: "No refunds once purchased — know what you're getting before you buy.",
  approved: false,
}

/* ── PAYMENT BOUNDARY (Felicia §10) ────────────────────────────────────────
   "Payment integration should be built as a separate but connected component
   so the event lead capture can still operate even while final pricing/payment
   offers are being approved."

   Honoured literally. This is the contract the payment component implements:

     purchase  →  account/access  →  welcome  →  onboarding  →  correct level

   Also honoured from §10: "A visitor should NOT have to create a full student
   account just to become a lead." The funnel has no account step at all.
   ────────────────────────────────────────────────────────────────────────── */
export const PAYMENT = {
  /** Still off. Display is on; checkout is not. See the header note. */
  enabled: false,
  provider: 'stripe' as 'stripe' | 'ghl' | null,
  postPurchaseFlow: ['account', 'welcome', 'onboarding', 'level-access'] as const,
  successPath: '/app',
} as const

/* ── HELPERS ───────────────────────────────────────────────────────────────
   Anything that renders a price must go through these. That way a single
   PRICING_PUBLISHED flag is genuinely enough to keep numbers off the site.
   ────────────────────────────────────────────────────────────────────────── */
export const levelBySlug = (slug: string) => LEVELS.find(l => l.slug === slug)

function money(n: number) {
  return `${CURRENCY.symbol}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function priceLabel(
  amount: number | null,
  opts: { per?: 'once' | 'month'; tbd?: string } = {},
): string {
  const tbd = opts.tbd ?? 'Pricing announced soon'
  if (!PRICING_PUBLISHED || amount === null) return tbd
  return `${money(amount)}${opts.per === 'month' ? '/mo' : ''}`
}

/** "$197 one-time" — the pathway card label from the approved layout. */
export function oneTimeLabel(amount: number | null): string {
  if (!PRICING_PUBLISHED || amount === null) return 'Pricing announced soon'
  return `${money(amount)} one-time`
}

/** Sum of the four levels bought separately. $1,388 with today's numbers.
    Computed, never typed, so it cannot drift from the four cards above it. */
export function separateTotal(): number | null {
  if (!PRICING_PUBLISHED) return null
  const amounts = LEVELS.map(l => l.oneTime)
  return amounts.some(a => a === null) ? null : (amounts as number[]).reduce((a, b) => a + b, 0)
}

/** What the bundle saves against buying separately. $391 today. */
export function bundleSavings(): number | null {
  const sep = separateTotal()
  if (sep === null || BLUEPRINT_BUNDLE.oneTime === null) return null
  return sep - BLUEPRINT_BUNDLE.oneTime
}

/** "$197–$497" — the range the FAQ quotes. */
export function levelRange(): string | null {
  if (!PRICING_PUBLISHED) return null
  const amounts = LEVELS.map(l => l.oneTime).filter((a): a is number => a !== null)
  if (amounts.length === 0) return null
  return `${money(Math.min(...amounts))}–${money(Math.max(...amounts))}`
}

export const fmtMoney = money

/** True when every value Surpaul owns is in. Used by the DRAFT gate.
    Still false today: the refund wording and the founding-member wording are
    both unapproved, which is correct — see their notes above. */
export const pricingReady = () =>
  PRICING_PUBLISHED &&
  LEVELS.every(l => l.oneTime !== null || l.monthly !== null) &&
  REFUND_POLICY.approved &&
  OFFERS.foundingMember.approved
