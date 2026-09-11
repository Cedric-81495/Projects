/* ═══════════════════════════════════════════════════════════════════════════
   MEMBERSHIP + PRICING  —  OWNER: SURPAUL (approves) · BRAND DIRECTION (defines)
   Source: the approved brand direction, Aug 14 — §1 Pricing + Membership
   Structure, §9 Event Incentive, §10 Account Creation + Payment.
   Amounts: Surpaul's final-direction memo (CEDRIC SIDE §1).

   the brand requirement, verbatim: "Please build the system so pricing can be
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

/* ── LEVEL DETAIL PAGES ────────────────────────────────────────────────────
   ⚠ FALSE UNTIL CHECKOUT IS REAL. This is the single switch that turns the
   four pathway cards from inert articles into links.

   The cards are BUILT to navigate — markup, hover state and focus ring are all
   in place — because the work of making them linkable later should be a flag,
   not a rewrite. What is missing is the destination being worth arriving at:

     · membership_plans.published is false and amount_cents is null
     · STRIPE_MODE is test
     · /api/v1/checkout is auth: 'student', so a visitor cannot reach it

   A card that leads to a page whose only button dead-ends at a login wall is
   worse than a card that does not lead anywhere. Flip this the same day the
   level pages exist and checkout takes a card — not before, and not to preview
   it in production.

   ⚠ THE CARDS MUST NOT LOOK CLICKABLE WHILE THIS IS FALSE. Their hover state
   is a readability lift, not an affordance: no pointer cursor, no underline, no
   arrow. See .fn-path-card in funnel.css. */
export const LEVEL_PAGES_OPEN = false

/** Where a level card points once LEVEL_PAGES_OPEN is true. */
export const levelHref = (slug: string) => `/levels/${slug}`

/** Master gate. While false: cards show `tbdLabel`, never a number. */
export const PRICING_PUBLISHED = true

/** Brand direction §1: "Currency: USD." */
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
  /* ⚠ NULLED 2026-09-11 — THE PLAN IS TBD AND WAS BEING ADVERTISED.
     Surpaul's memo §1 states it: "3 monthly payments of $397. Total on payment
     plan: $1,191." The funnel was printing that, and there was no way to pay it.

     Nothing exists behind the offer. seed-stripe.mts creates five ONE-TIME
     prices and no recurring one; there is no membership_plans row with
     billing = 'subscription'; nothing anywhere inserts into `subscriptions`.
     A buyer could read a specific price and a specific access policy and find
     no route to either — on the same card as the no-refund line.

     ⚠ RESTORING IT IS NOT PUTTING 397 BACK. Read the build note under
     `planNote` before you do. The memo rules out the thing a bare Stripe
     subscription would give you.

     Set to 397 again only when the plan can actually be bought. Every surface
     reads this value, so one edit turns the offer on everywhere at once — which
     is exactly why it must not be turned on ahead of the mechanism. */
  monthly: null as number | null,
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

/* ══ BEFORE YOU BUILD THE PAYMENT PLAN ══════════════════════════════════════
   Written down because the memo and a default Stripe subscription look like
   the same product and are not.

   ── WHAT HE ASKED FOR ────────────────────────────────────────────────────
   §1, both halves, and the second half is the one that gets missed:

     "3 monthly payments of $397. Total on payment plan: $1,191."
     "I do NOT want a traditional endless monthly subscription required just to
      keep accessing the course right now. The core product should be a
      purchase."

   So it is a FIXED INSTALMENT — three charges and it is paid off — not a
   recurring plan. Seed a $397 recurring price, point checkout at it, and you
   have built the exact thing he ruled out. Payment four then lands on somebody
   who has already paid in full.

   Stripe's mechanism for stopping is a subscription schedule: one phase,
   `iterations: 3`, `end_behavior: 'cancel'`, created in the
   checkout.session.completed handler. Without it the subscription runs forever.

   ── THE TRAP IN THE WEBHOOK ──────────────────────────────────────────────
   ⚠ customer.subscription.deleted SETS expires_at ON THE BUYER'S ENROLLMENTS.

   When the third payment completes and the schedule ends the subscription,
   that branch fires and revokes access from the person who just finished
   paying $1,191. Correct for a cancellation, catastrophic for a completion —
   and today the two are indistinguishable to that code. Whatever tracks
   payments made has to exist BEFORE the recurring price does.

   ── THE DECISION THAT IS NOT A DEVELOPER'S ───────────────────────────────
   "If payments stop, access pauses." A pause implies it can resume. The code
   expires access at the end of the paid period, which is termination. They are
   different products:

     · PAUSE — miss payment two, pay a month later, access returns and one
       payment is still owed. Needs a resume path, retry handling, dunning, and
       a state that is neither active nor expired.
     · EXPIRE — a missed payment ends it, they have paid $794 for nothing, and
       the no-refund policy is what they meet when they complain. That is a
       chargeback with a sympathetic story attached.

   His word is "pauses". Put the second version in front of him before building
   either, and put both in front of counsel with the CROA question — instalment
   billing for credit-related services is squarely what CROA regulates.

   ── WHAT IS ALREADY DONE, SO NOBODY REBUILDS IT ──────────────────────────
   · lib/stripe/checkout.ts already branches on plan.billing and passes
     mode: 'subscription'.
   · grant_enrollments_for_payment already writes source = 'subscription' when
     billing = 'subscription' — which is what the pause branch keys on.
   · The `subscriptions` table exists (0004_commerce.sql).

   ── WHAT IS MISSING ──────────────────────────────────────────────────────
   · A membership_plans row with billing = 'subscription'. Suggest
     GWOPU-BLUEPRINT-PLAN, grants_level 4, grants_cumulative true — a second
     way to buy the bundle, not a fifth product, so the funnel still shows one
     bundle card with two payment options.
   · A recurring price in scripts/seed-stripe.mts.
   · The subscription schedule that stops it at three.
   · An INSERT into `subscriptions`. Nothing writes that table today, so the
     pause branch updates zero rows and cannot fire at all.
   · A completion branch that runs BEFORE the deletion branch: three paid means
     permanent, expires_at = null, never touched again.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── WHAT THE PLATFORM MUST SUPPORT (Brand direction §1) ───────────────────────────
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
  /* ⚠ scholarshipGiveaway REMOVED 2026-09-11. Surpaul's instruction, directly:
     he did not originate the scholarship, was not aware of it, and does not
     want it. It came from the earlier brand direction and was never defined.
     Do not reinstate this flag without him asking for it by name. */
  oneTimePayment:        true,
  monthlyPayment:        true,
} as const

/* ── OFFERS ────────────────────────────────────────────────────────────────
   Brand direction §9: "Please build the structure now using editable placeholders
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
  /* ⚠ THE SCHOLARSHIP OFFER WAS REMOVED 2026-09-11, ON SURPAUL'S INSTRUCTION.

     He did not originate it, was not aware of it, and does not want it. It came
     from the earlier brand direction, and it was never defined — nobody ever
     said what it was worth, who drew it, when, or how a winner would be told.

     ⚠ REMOVING THE CODE DOES NOT CLOSE THE ONE THING THAT WAS PROMISED.
     At least one person signed up on event day under wording that said they
     were entered into it. That is a promise made to a named individual, and it
     is outstanding whether or not this file mentions it. It is Surpaul's to
     settle — raised with him, recorded here so it is not lost when the last
     line of scholarship code disappears.

     Do not reinstate any of this without him asking for it by name. */
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

/* ── PAYMENT BOUNDARY (Brand direction §10) ────────────────────────────────────────
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
