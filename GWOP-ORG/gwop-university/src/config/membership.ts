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
  /* ⚠ ADDED 2026-09-08 from Surpaul's memo §1. He states the plan total
     explicitly — "Total on payment plan: $1,191" — and the funnel was showing
     "or 3 payments of $397" without it. Three times a number is arithmetic
     somebody has to do while deciding whether to buy, and the plan costs $194
     more than the one-time price. Stating it is his instruction and it is also
     the honest version.

     Computed rather than typed so it cannot drift from `monthly` × the months
     above it — see planTotal() below. */

  /* ⚠ HIS WORDS, §1: "People on the payment plan receive access according to
     their payment status. If payments stop, access pauses."

     This is the cancellation half of the Refund & Cancellation policy, and it
     was living only in the memo. Anyone choosing the plan over the one-time
     price is choosing it because of cash flow, so this is the condition most
     relevant to them.

     ⚠ NOT BUILT YET. This is subscription logic — see `subscriptions` in
     0004_commerce.sql for the table it will use. Stating it on the page is
     correct now; enforcing it is work that has to exist before the first plan
     payment is taken. */
  planNote: 'Access continues while payments are current and pauses if they stop.',
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
  /* ⚠ THE WORDING THAT WAS BLOCKING THIS NOW EXISTS — but the decision does
     not. Read before flipping `approved`.

     Surpaul's memo §4 defines it fully for the first time: who qualifies
     (anyone registered at the 8/30 event, automatically), the five benefits
     (badge/status, first access to new releases, special pricing on eligible
     new products, invitations to selected private sessions, status does not
     expire), the limit (it does NOT mean future products are free), and the
     window — 2026-08-30 to 2026-09-30.

     ⚠ THE WINDOW CLOSES IN THREE WEEKS AND THE FUNNEL DOES NOT MENTION IT.
     That is the open question, and it is Surpaul's rather than mine: is
     Founding Member a funnel offer or an account status?

       · As an account STATUS it needs nothing on /830 — event registrants
         already qualify automatically and it shows in their dashboard.
       · As a funnel OFFER it is the only genuine deadline on the page, and
         "eligibility closes September 30" is a real reason to act now rather
         than a manufactured one. But it also means every new lead between now
         and the 30th becomes a Founding Member, which is a larger cohort than
         "people who came to the launch event" and dilutes what the status
         means.

     `approved` stays false until he answers, because approving it is what puts
     it on the page. The structure is ready either way. */
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
   ⚠ APPROVED 2026-09-08. SURPAUL, DIRECTLY: "REFUND POLICY - no refund."

   His memo previously recorded this as "no refund (TBD)", which is why
   `approved` was false and /refunds published a holding line instead. He has
   now confirmed the position, and per GWOP-CONTEXT §1 legal wording is his
   call, so the flag is true and the sentence publishes.

   ONE STRING, THREE SURFACES. The funnel's bundle card, the funnel FAQ's cost
   answer, and /refunds all read this value. That is deliberate: a refund
   position stated in three places from three sources will eventually
   contradict itself, and a contradiction is worse than either version.

   ⚠ WHAT APPROVING THIS DOES NOT DO, and Surpaul should hear it once.
   A no-refund policy is a statement of our position, not a shield:

     · Card networks allow chargebacks regardless of what the page says. Visa
       and Mastercard rules govern that, not our terms. A customer who disputes
       a charge can win it, and repeated disputes affect the Stripe account
       standing rather than just the individual sale.
     · Some consumer-protection rules override a blanket no-refund term. Which
       ones apply depends on where the buyer is, not where we are.

   So the sentence can publish now. But the day checkout opens, the practical
   question is how we HANDLE a dispute, and that is a decision nobody has made
   yet. It is not blocking — nothing can be charged today — and it is worth
   deciding before the first payment rather than during the first dispute.

   ⚠ TREAT THE WORDING AS FIXED. It publishes on three surfaces and it is now
   an approved legal statement. Change it with Surpaul, in one edit, here.
   ────────────────────────────────────────────────────────────────────────── */
export const REFUND_POLICY = {
  text: "No refunds once purchased — know what you're getting before you buy.",
  /* true = the sentence renders plainly and /refunds publishes it. false =
     /refunds shows a holding line and the funnel marks the sentence as draft. */
  approved: true,
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

/** Total across the payment plan — $1,191 with today's numbers. Computed from
    `monthly` × `planMonths`, never typed, so it cannot disagree with the
    per-payment figure shown beside it. */
export function planTotal(): number | null {
  if (!PRICING_PUBLISHED || BLUEPRINT_BUNDLE.monthly === null) return null
  return BLUEPRINT_BUNDLE.monthly * BLUEPRINT_BUNDLE.planMonths
}

/* ══ IS THE BUNDLE STILL THE BEST DEAL? ══════════════════════════════════════
   ⚠ NOT ALWAYS, AND THAT IS WHY THIS EXISTS.

   Surpaul's memo §1: "I want the full GWOP University bundle to clearly be the
   best deal." For a new buyer it is — $997 against $1,388 separately.

   But once somebody already owns a level, the bundle re-charges for it. Run
   the numbers across every combination and the bundle only wins for a buyer
   who owns nothing, Level 1, or Level 2:

     owns nothing    remaining $1,388   bundle wins
     owns L1         remaining $1,191   bundle wins
     owns L2         remaining $1,091   bundle wins
     owns L3         remaining $  991   bundle LOSES by $6
     owns L4         remaining $  891   bundle loses
     owns L1+L2      remaining $  894   bundle loses
     …and every other combination

   Twelve of fifteen cases. So showing the bundle to an existing customer is
   often showing them the worse option, which contradicts the instruction it
   was priced to satisfy.

   ⚠ THE FIX IS TO HIDE IT, NOT TO DISCOUNT IT. Crediting prior spend needs
   Stripe coupons, a record of what each user has paid, and a decision about
   whether credit expires — real work for a case that has not happened yet.
   Hiding the bundle when it is not the best deal satisfies the memo exactly:
   the bundle is never presented as anything other than the best offer
   available, because when it is not, it is not presented.

   ⚠ AND IT LEAVES THE BUYER BETTER OFF. Someone who owns Level 3 and buys the
   remaining three levels separately pays $991 — six dollars less than the
   bundle, and they are not paying twice for something they own.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Total to buy every level the user does not already hold. */
export function remainingSeparateTotal(ownedLevels: readonly number[]): number | null {
  if (!PRICING_PUBLISHED) return null
  const rest = LEVELS.filter(l => !ownedLevels.includes(l.order))
  if (rest.length === 0) return 0
  /* If any remaining level has no price, the comparison cannot be trusted, so
     it returns null and the caller falls back to showing the bundle. Better a
     buyer sees one extra option than a comparison built on a missing number. */
  if (rest.some(l => l.oneTime === null)) return null
  return rest.reduce((sum, l) => sum + (l.oneTime ?? 0), 0)
}

/**
 * Whether the bundle should be offered at all.
 *
 * True for a buyer who owns nothing — the normal case, and the one the memo's
 * pricing table describes. False once buying the remaining levels separately
 * would cost the same or less.
 */
export function bundleIsBestDeal(ownedLevels: readonly number[] = []): boolean {
  if (BLUEPRINT_BUNDLE.oneTime === null) return false
  /* Owns all four already — nothing to sell. */
  if (ownedLevels.length >= LEVELS.length) return false
  const remaining = remainingSeparateTotal(ownedLevels)
  /* Unknown remaining total: show it. See the note in remainingSeparateTotal. */
  if (remaining === null) return true
  return BLUEPRINT_BUNDLE.oneTime < remaining
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
