/* ═══════════════════════════════════════════════════════════════════════════
   MEMBERSHIP + PRICING  —  OWNER: SURPAUL (approves) · FELICIA (defines)
   Source: Felicia's confirmed directions, Aug 14 — §1 Pricing + Membership
   Structure, §9 Event Incentive, §10 Account Creation + Payment.

   ⚠️ NOTHING IN THIS FILE IS PUBLISHED YET.
   `PRICING_PUBLISHED = false` means no number, term or refund sentence renders
   anywhere on the site. Felicia: "Pricing: TBD / Pending Surpaul approval" and
   "Do not publish a final policy until approved."

   Felicia's requirement, verbatim: "Please build the system so pricing can be
   changed easily without redesigning the website/app."

   That is what this file is. Every price, billing mode, promo and offer is a
   value here. To change pricing later: edit this file, flip PRICING_PUBLISHED,
   deploy. No layout work, no new components, no design review.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Master gate. While false: cards show `pricing.tbdLabel`, never a number. */
export const PRICING_PUBLISHED = false

/** Felicia §1: "Currency: USD." */
export const CURRENCY = { code: 'USD', symbol: '$' } as const

/* ── THE FOUR LEVELS ───────────────────────────────────────────────────────
   `slug` matches src/content/pathway.ts — do not rename, routes depend on it.
   `oneTime` / `monthly` are null until Surpaul approves. Null renders as TBD.
   `sku` is what the payment component and GHL will key membership access on
   (§10: "membership access based on the level/product purchased").
   ────────────────────────────────────────────────────────────────────────── */
export const LEVELS = [
  { slug: 'freshman',  sku: 'GWOPU-FRESHMAN',  order: 1,
    oneTime: null as number | null, monthly: null as number | null },
  { slug: 'sophomore', sku: 'GWOPU-SOPHOMORE', order: 2,
    oneTime: null as number | null, monthly: null as number | null },
  { slug: 'junior',    sku: 'GWOPU-JUNIOR',    order: 3,
    oneTime: null as number | null, monthly: null as number | null },
  { slug: 'senior',    sku: 'GWOPU-SENIOR',    order: 4,
    oneTime: null as number | null, monthly: null as number | null },
] as const

/** Full-pathway bundle. Felicia §1: the journey ends at the GWOP Blueprint. */
export const BLUEPRINT_BUNDLE = {
  sku: 'GWOPU-BLUEPRINT-ALL',
  oneTime: null as number | null,
  monthly: null as number | null,
} as const

/* ── WHAT THE PLATFORM MUST SUPPORT (Felicia §1) ───────────────────────────
   Flags, not features. Each one is off until the business decides to activate
   it. They exist here so the answer to "can the system do X?" is a one-line
   change instead of a rebuild.
   ────────────────────────────────────────────────────────────────────────── */
export const CAPABILITIES = {
  individualLevelAccess: true,   // buy a single level
  upgradeToHigherLevel:  true,   // Freshman → Sophomore etc., credit prior spend
  promoCodes:            true,   // discount codes
  eventOffers:           true,   // 8/30-specific pricing
  foundingMember:        true,   // §9
  scholarshipGiveaway:   true,   // §9
  oneTimePayment:        true,   // §1 "if we decide to activate them"
  monthlyPayment:        true,   // §1 — same
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
    /** Set to a number when Surpaul approves the founding-member price. */
    priceOverride: null as number | null,
    /** Cap on founding-member seats, if there is one. */
    seatLimit: null as number | null,
    approved: false,
  },
  scholarship: {
    id: 'SCHOLARSHIP-0830',
    label: 'Scholarship / Giveaway',
    /** Drawing rules are Surpaul's. Never invent giveaway terms. */
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
   Felicia §1: "Refund/cancellation policy: TBD. Do not publish a final policy
   until approved." Attorney-supplied wording only — never drafted here.
   ────────────────────────────────────────────────────────────────────────── */
export const REFUND_POLICY = { text: null as string | null, approved: false }

/* ── PAYMENT BOUNDARY (Felicia §10) ────────────────────────────────────────
   "Payment integration should be built as a separate but connected component
   so the event lead capture can still operate even while final pricing/payment
   offers are being approved."

   Honoured literally: there is no payment code in this repo. This is the
   contract the payment component will implement, written down now so nobody
   has to guess later, and so the 8/30 funnel stays independent of it.

     purchase  →  account/access  →  welcome  →  onboarding  →  correct level

   Also honoured from §10: "A visitor should NOT have to create a full student
   account just to become an August 30 lead." /830 has no account step at all.
   ────────────────────────────────────────────────────────────────────────── */
export const PAYMENT = {
  /** Off for Aug 30 by decision. No card is taken at the booth. */
  enabled: false,
  /** Chosen after the event; the flow below does not depend on which. */
  provider: null as 'stripe' | 'ghl' | null,
  /** Steps the component owns, in order. Access is granted at step 2. */
  postPurchaseFlow: ['account', 'welcome', 'onboarding', 'level-access'] as const,
  /** Where a completed purchase lands the student. */
  successPath: '/app',
} as const

/* ── HELPERS ───────────────────────────────────────────────────────────────
   Anything that renders a price must go through these. That way a single
   `PRICING_PUBLISHED` flag is genuinely enough to keep numbers off the site.
   ────────────────────────────────────────────────────────────────────────── */
export const levelBySlug = (slug: string) => LEVELS.find(l => l.slug === slug)

export function priceLabel(
  amount: number | null,
  opts: { per?: 'once' | 'month'; tbd?: string } = {},
): string {
  const tbd = opts.tbd ?? 'Pricing announced soon'
  if (!PRICING_PUBLISHED || amount === null) return tbd
  const n = amount.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return `${CURRENCY.symbol}${n}${opts.per === 'month' ? '/mo' : ''}`
}

/** True when every value Surpaul owns is in. Used by the DRAFT gate. */
export const pricingReady = () =>
  PRICING_PUBLISHED &&
  LEVELS.every(l => l.oneTime !== null || l.monthly !== null) &&
  REFUND_POLICY.approved &&
  OFFERS.foundingMember.approved
