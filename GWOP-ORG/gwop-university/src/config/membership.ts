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

   ⚠ THE PAYMENT PLAN THAT USED TO BE LISTED HERE IS GONE. A 3 × $397 line
   (total $1,191) sat under the bundle until the GWOP Pricing, Payment &
   Package Master, 2026-09-14. Surpaul, verbatim: "I want to get rid of this
   totally." There are no instalments, no subscriptions and no recurring
   charges. See the note beside BLUEPRINT_BUNDLE for the three reasons, and
   supabase/migrations/0020 for what was left dormant behind it.

   ⚠ DISPLAY IS NOT THE SAME THING AS CHECKOUT. Read this before telling
   anybody they can buy.

   ⚠ CORRECTED 2026-09-21 AGAINST PRODUCTION. This block used to say all five
   rows had published = false and amount_cents = null. Both had stopped being
   true. Anyone reading the old text would have counted three guards where
   only two remain — which is exactly the kind of comment that gets somebody
   comfortable flipping a switch. Verified state of `membership_plans`:

     sku                  amount_cents   price_id_test   price_id_live
     GWOPU-FRESHMAN             19700   set             NULL
     GWOPU-SOPHOMORE            29700   set             NULL
     GWOPU-JUNIOR               39700   set             NULL
     GWOPU-SENIOR               49700   set             NULL
     GWOPU-BLUEPRINT-ALL        99700   set             NULL

   All five are published = true. The prices are seeded, correct against the
   master doc, and live in TEST mode only.

   What actually stops a real charge today, in order of how hard each is to
   remove by accident:

     1. Every `stripe_price_id_live` is NULL. priceIdFor() returns null in
        live mode and createCheckoutSession throws plan_missing_stripe_price.
        ⚠ THIS IS THE LOAD-BEARING ONE. Flipping STRIPE_MODE alone does not
        take a payment — it takes an error. Minting live prices is a separate,
        deliberate act: run scripts/seed-stripe.mts against live keys and
        write the IDs into these rows.
     2. STRIPE_MODE is `test` in the deployed environment. One env var.
     3. /api/v1/checkout is declared `auth: 'student'` — a visitor with no
        account cannot reach it at all.

   ⚠ published = true MEANS THE PLAN ROWS ARE NO LONGER A GUARD. They were
   the first line of defence when this comment was written and they are not
   any more. Do not re-add them to the list without checking the database.

   ⚠ AND THE ATTORNEY REVIEW IS STILL OPEN. The no-refund line, the Founding
   Member terms and Lesson 8.7 are on the launch gate in the Master Build &
   Launch Requirements. Guards 1 to 3 are technical; this one is not, and it
   is the reason not to mint live prices yet even once the rest is ready.

   So the page states Surpaul's approved prices and every CTA points at the
   free assessment, which is exactly what the approved layout does. To actually
   sell: run scripts/seed-stripe.ts against live keys, write the live price IDs
   into membership_plans, switch STRIPE_MODE to live, and
   build signup → checkout. Until then the buttons are honest — they lead to
   the Blueprint, not to a card form.

   ⚠ THE ENTITLEMENT DEFECT IS FIXED — 2026-09-21. This block used to open
   "AND FIX THE ENTITLEMENT FIRST", and it was right to. In 0007_seed.sql,
   GWOPU-SENIOR and GWOPU-BLUEPRINT-ALL both carried grants_level = 4 with
   grants_cumulative = true, so Level 4 at $497 unlocked everything the $997
   bundle unlocked. The bundle was irrational to buy and the "$1,388
   separately" framing did not hold. $500 of leak per affected purchase.

   Closed in three layers, and verified against production:
     · 0014 — RLS reads enrolled_levels as a set, not a ceiling
     · 0021 — grants_cumulative = false on the four levels, true on the bundle
     · 0023 — a check constraint refusing cumulative access to any SKU other
       than the bundle, and the column default flipped from true to false.
       The default was the actual cause: nothing was mistyped, a default did
       what defaults do.

   The behaviour is covered by tests/entitlements.spec.ts — the seven
   regression tests from the Master Build doc, run through the same grant
   function the Stripe webhook calls.

   ⚠ NOBODY HAD BOUGHT LEVEL 4 WHEN THIS WAS FIXED, so nothing actually
   leaked and no remediation was owed. That is luck, not process. Do not read
   it as evidence the defect was minor.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── LEVEL DETAIL PAGES ────────────────────────────────────────────────────
   ⚠ FALSE UNTIL CHECKOUT IS REAL. This is the single switch that turns the
   four pathway cards from inert articles into links.

   The cards are BUILT to navigate — markup, hover state and focus ring are all
   in place — because the work of making them linkable later should be a flag,
   not a rewrite. What is missing is the destination being worth arriving at:

     · every stripe_price_id_live is NULL, so live mode cannot charge
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

   ⚠ ONE-TIME ONLY. THERE IS NO PAYMENT PLAN, AND THERE IS NOT GOING TO BE.

   The Pricing, Payment & Package Master (2026-09-14) supersedes the memo's
   "3 monthly payments of $397" and every earlier instalment note. `monthly`,
   `planMonths` and `planNote` were removed on that date rather than left
   nulled, because a null is an invitation and three separate people have now
   asked whether the plan can be "turned back on".

   THE THREE REASONS, so nobody re-litigates them:

     1. The buyers are selected for cash-flow problems. That is who the product
        is for and who defaults on instalments. Each payment after the first
        carries its own decline risk, and this population has more expired
        cards, more insufficient funds and more closed accounts. Instalments
        here do not produce revenue; they produce dunning, paused accounts,
        support tickets and chargebacks.
     2. CROA restricts collecting payment before promised services are
        performed. A multi-month schedule against progressively-released
        content is the messiest possible version of that question. A single
        payment for immediately-delivered material is the cleanest. This does
        not resolve CROA — counsel still has to — but it removes the hard half.
     3. It contradicts the curriculum. Module 7.2 teaches good leverage versus
        bad; Level 1 Module 2 tells people to stop using credit cards when they
        are short on cash. Offering a card-funded instalment plan to someone in
        exactly that position is the brand arguing with itself.

   THE LADDER IS THE PAYMENT PLAN. A $197 entry point already exists. Someone
   who cannot pay $997 today pays $197, finishes Level 1, gets a result and
   comes back. The customer controls the pace and we carry no collection risk.
   With instalments you finance a promise; with the ladder every dollar
   collected has already been earned. See LADDER_NOTE and UPGRADE_CREDIT below
   — together they are the replacement, not an absence.
   ────────────────────────────────────────────────────────────────────────── */
export const BLUEPRINT_BUNDLE = {
  sku: 'GWOPU-BLUEPRINT-ALL',
  oneTime: 997 as number | null,
} as const

/* ── THE LADDER ────────────────────────────────────────────────────────────
   Master doc, Part Two: this replaces plan language on the pricing page. It is
   copy, so it lives here beside the numbers it depends on rather than in
   content/funnel.ts — the second sentence is only true because UPGRADE_CREDIT
   exists, and the two must not be editable apart.
   ────────────────────────────────────────────────────────────────────────── */
/* ⚠ TWO PARTS, AND THE SECOND ONE IS A PROMISE.
   The first two sentences describe how the ladder works and are true today.
   The third commits us to crediting an earlier purchase — which the checkout
   does not yet do (see UPGRADE_CREDIT below). Publishing that sentence beside
   a live buy button would be a term we cannot honour automatically, so it is
   gated on UPGRADE_CREDIT_AT_CHECKOUT rather than commented out: flipping one
   boolean is what ships it, not an edit to copy nobody can find. */
const LADDER_CLAUSE =
  'Start with one level. Each level stands on its own and opens the moment you '
  + 'buy it. Take the next one when you are ready'

export const LADDER_NOTE_PARTS = {
  /* ⚠ NOT A PREFIX OF `full`, AND DELIBERATELY SO. Rendered on 830 this sits
     directly beneath funnel.levelNote — "Each level is sold on its own —
     buying one level opens that level" — and the master doc's own wording
     then says "Each level stands on its own and opens the moment you buy
     it." Same fact, twice, in consecutive lines. It reads as padding on the
     page even though it reads fine in the document, where nothing precedes
     it. So the published fragment keeps only what the level note does not
     already cover: that you can start anywhere and come back.

     Do not "restore the full wording" here. `full` below is the canonical
     sentence and is what ships once the credit is honoured at checkout — at
     which point the redundancy is worth paying for, because the sentence is
     carrying a commercial promise rather than repeating a term. */
  ladder: 'Start with one level and take the next one when you are ready.',
  /** The master doc's wording. Needs the checkout to honour the credit. */
  full:
    `${LADDER_CLAUSE} — and if you upgrade to the full bundle later, we credit `
    + 'everything you have already paid.',
} as const

/** The master doc's full sentence. Kept as the canonical wording. */
export const LADDER_NOTE = LADDER_NOTE_PARTS.full

/* ⚠ TRUE SINCE 2026-09-21 — checkout now does the arithmetic.
   lib/stripe/checkout.ts reads enrolled_levels, prices the bundle through
   upgradeToBundlePrice() and applies the difference as a Stripe coupon, so the
   sentence below is a term the system honours rather than one a person has to
   remember. Setting this back to false without also removing that block would
   leave the credit applied while the site stops mentioning it. */
export const UPGRADE_CREDIT_AT_CHECKOUT = true

/** What the pricing page may say today about buying one level at a time. */
export function ladderNote(): string {
  return UPGRADE_CREDIT_AT_CHECKOUT ? LADDER_NOTE_PARTS.full : LADDER_NOTE_PARTS.ladder
}

/* ── UPGRADE CREDIT ────────────────────────────────────────────────────────
   Someone buys one level, later wants the bundle. Credit the earlier purchase
   in full. We collect $997 either way rather than more, and that is deliberate.

   ⚠ COMPUTED, NOT TABULATED. The master doc prints the four upgrade prices
   ($800 / $700 / $600 / $500) as a table. They are just 997 minus what the
   buyer has paid, so typing them would let the table drift from LEVELS the
   first time a level price moves. If you need the table, map over LEVELS.

   ⚠ THIS CHANGES WHAT bundleIsBestDeal() IS FOR — read the note above it.

   ⚠ NOT YET ENFORCED AT CHECKOUT. This is the pricing rule; applying it needs
   Stripe coupons or a dynamic price in lib/stripe/checkout.ts plus a read of
   what the user already owns. Until that exists, the sentence on the level
   pages is a commitment we honour by hand. Do not publish it on a page with a
   live buy button until the checkout does the arithmetic.
   ────────────────────────────────────────────────────────────────────────── */

/** What the bundle costs a buyer who already owns some levels. Never below 0. */
export function upgradeToBundlePrice(ownedLevels: readonly number[]): number | null {
  if (!PRICING_PUBLISHED || BLUEPRINT_BUNDLE.oneTime === null) return null
  const paid = LEVELS
    .filter(l => ownedLevels.includes(l.order))
    .map(l => l.oneTime)
  if (paid.some(a => a === null)) return null
  const credit = (paid as number[]).reduce((a, b) => a + b, 0)
  return Math.max(0, BLUEPRINT_BUNDLE.oneTime - credit)
}

/* ── THE LEVEL 4 ORDER BUMP ────────────────────────────────────────────────
   Master doc, Part Two: "your highest-value single change and it costs nothing
   to implement". At $497, Level 4 alone is half the bundle price, so anyone on
   that checkout page is one sentence from $997.

   `{delta}` resolves at render time from the two prices so it cannot disagree
   with them. Show this on the Level 4 purchase surface only.
   ────────────────────────────────────────────────────────────────────────── */
/* ── THE CREDIT LINE ───────────────────────────────────────────────────────
   Pricing Master, verbatim: "Put it on every level sales page: 'Buy any level
   now. If you upgrade to the full bundle later, we credit what you paid.'"

   ⚠ THE WORDING IS QUOTED FROM THE DOC, NOT PARAPHRASED. It is a commercial
   term, and the sentence a buyer acted on is the sentence that has to be
   honoured. Reword it and the promise and the behaviour drift apart.

   ⚠ RENDERED ONLY WHEN UPGRADE_CREDIT_AT_CHECKOUT IS TRUE. Published while
   checkout charges full price, it is a term we break on every upgrade. */
export const UPGRADE_CREDIT_LINE =
  'Buy any level now. If you upgrade to the full bundle later, we credit what you paid.'

/** The credit line, or null when checkout cannot yet honour it. */
export function upgradeCreditLine(): string | null {
  if (!PRICING_PUBLISHED || !UPGRADE_CREDIT_AT_CHECKOUT) return null
  return UPGRADE_CREDIT_LINE
}

export const ORDER_BUMP = {
  appliesToSku: 'GWOPU-SENIOR',
  template:
    'Level 4 on its own is {level}. All four levels are {bundle}. '
    + 'Add Levels 1, 2 and 3 for {delta} more →',
} as const

/**
 * The order-bump line with its three numbers filled in, or null when it must
 * not be shown.
 *
 * ⚠ RETURNS null RATHER THAN A PARTIAL SENTENCE. If either price is missing or
 * pricing is unpublished, a template with "{delta}" left in it would ship to a
 * buyer. Null is the only safe failure here — the caller renders nothing.
 *
 * ⚠ THE DELTA IS SUBTRACTED, NEVER TYPED. $500 is 997 − 497 today; if either
 * price moves, this moves with it. A hard-coded number on a checkout page is
 * how a site ends up offering three levels for less than they cost.
 */
export function orderBumpLine(sku: string): string | null {
  if (sku !== ORDER_BUMP.appliesToSku) return null
  if (!PRICING_PUBLISHED) return null

  const level = LEVELS.find(l => l.sku === ORDER_BUMP.appliesToSku)?.oneTime ?? null
  const bundle = BLUEPRINT_BUNDLE.oneTime
  if (level === null || bundle === null) return null

  const delta = bundle - level
  /* A non-positive delta means the bundle is no longer dearer than Level 4 —
     the arithmetic behind the whole line has stopped holding. Say nothing
     rather than invite somebody to "add three levels for $0 more". */
  if (delta <= 0) return null

  return ORDER_BUMP.template
    .replace('{level}', money(level))
    .replace('{bundle}', money(bundle))
    .replace('{delta}', money(delta))
}

/* ── THE CHECKOUT LINE ─────────────────────────────────────────────────────
   Master doc, Part Three §2. Costs a handful of sales, buys the credibility
   the brand is built on, and prevents the purchases most likely to become
   complaints. It only works because the $197 entry point and the upgrade
   credit both exist — it routes the buyer somewhere they can succeed rather
   than losing them.
   ────────────────────────────────────────────────────────────────────────── */
export const CHECKOUT_CONSCIENCE_LINE =
  'If this would stretch you, start with Level 1 at {entry} — or take the free '
  + 'Blueprint and come back when it will not. That is the same advice we give '
  + 'inside the course.'

/**
 * The checkout line with the entry price filled in, or null when it must not
 * be shown on this card.
 *
 * ⚠ THE {entry} PRICE IS LEVEL 1's, NOT THE CARD'S. The whole line is a
 * redirect to the cheapest door. Resolving it against the plan being viewed
 * would produce "start with Level 1 at $497" on the Level 4 card, which is
 * the opposite of the advice.
 *
 * ⚠ AND IT IS SUPPRESSED ON LEVEL 1 ITSELF — corrected 2026-09-21 after it
 * shipped. On the entry card it read "If this would stretch you, start with
 * Level 1 at $197" to somebody already looking at Level 1 for $197. Circular,
 * and it reads as boilerplate, which cheapens the same sentence on the cards
 * where it does real work.
 *
 * ⚠ DO NOT READ THIS AS "THE LINE MATTERS LESS DOWN HERE". Level 1 buyers are
 * the most likely of the four to be stretched by the purchase. What is missing
 * on that card is the OTHER half of the master doc's sentence — the free
 * Blueprint — which is the only route left below $197. Wording that is
 * Surpaul's call, not something to improvise here, so the card says nothing
 * rather than something circular. Raise it; do not quietly invent copy.
 */
export function conscienceLine(sku: string): string | null {
  if (!PRICING_PUBLISHED) return null
  const entry = LEVELS.find(l => l.order === 1) ?? null
  if (entry === null || entry.oneTime === null) return null
  if (sku === entry.sku) return null
  return CHECKOUT_CONSCIENCE_LINE.replace('{entry}', money(entry.oneTime))
}

/* ⚠ DO NOT ENABLE BUY-NOW-PAY-LATER AT CHECKOUT.
   Stripe offers Klarna, Afterpay and Affirm as payment method types and they
   are off by default — keep them off. Level 1 Module 8 teaches students to
   audit their BNPL exposure. Selling the course through BNPL is a
   contradiction a buyer will notice, and screenshot. Master doc, Part Two. */
export const BNPL_ALLOWED = false

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
  /* ⚠ FALSE 2026-09-14, and this one is not a "not yet". The Pricing, Payment
     & Package Master rules out instalments, subscriptions and recurring
     charges of any kind — see the reasoning under THE BUNDLE. The ladder plus
     UPGRADE_CREDIT is the answer to "what about people who cannot pay $997",
     not a monthly price. Flipping this true re-opens a CROA question counsel
     has not answered and contradicts Module 7.2. */
  monthlyPayment:        false,
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

   ⚠ HIDING IS NOW THE INTERIM FIX, NOT THE ANSWER. Superseded in principle
   2026-09-14 by the Pricing, Payment & Package Master, which mandates the
   upgrade credit this note previously deferred as "real work for a case that
   has not happened yet".

   With UPGRADE_CREDIT applied, the table above collapses: every buyer pays
   $997 in total however they get there, so the bundle is never the worse
   option and there is nothing to hide. Owns L3 is the case that used to lose
   by $6 — credited, the upgrade is $600 against $991 to finish separately.

   So this function stays, unchanged, only until checkout can do that
   arithmetic. It hides the bundle from buyers for whom it is currently priced
   badly, which remains true while upgrade pricing is not enforced. When
   upgradeToBundlePrice() is wired into lib/stripe/checkout.ts, replace the
   call sites with the credited price rather than deleting the bundle card —
   showing a credited $600 is the offer; showing nothing is a missed sale.

   THE ORIGINAL REASONING, kept because it explains the current behaviour:
   hiding the bundle when it is not the best deal satisfies the memo exactly —
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

  /* ⚠ COMPARES THE CREDITED PRICE ONCE THE CREDIT IS ENFORCED — 2026-09-21.
     Before this, it compared the full $997 and therefore hid the bundle from
     anyone holding Level 3 or 4. With the credit applied that comparison is
     the wrong one: a Level 3 owner is not choosing between $997 and $991, they
     are choosing between $600 and $991.

     Pricing Master: "You collect $997 either way rather than more. That is
     deliberate." Every route ends at $997 in total, so the credited bundle
     always beats finishing separately — and the card should be shown, not
     hidden. Hiding it was the workaround for not having this. */
  const price = UPGRADE_CREDIT_AT_CHECKOUT
    ? upgradeToBundlePrice(ownedLevels)
    : BLUEPRINT_BUNDLE.oneTime

  /* ⚠ A ZERO OR NEGATIVE CREDITED PRICE MEANS DO NOT SELL IT. Someone holding
     three levels may have paid more than the bundle costs — {2,3,4} is $1,191
     against $997. The doc's table only ever contemplates ONE prior purchase
     and says nothing about this, so nothing here invents a policy: the bundle
     is simply not offered, and they buy the one level they are missing at its
     own price, which is cheaper for them anyway. Stripe also rejects a
     zero-amount session, so there is no version of this that could be sold. */
  if (price === null || price <= 0) return false

  return price < remaining
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
  /* One-time only since 2026-09-14 — a level with no oneTime price has no
     price, and `monthly` is no longer a fallback anywhere. */
  LEVELS.every(l => l.oneTime !== null) &&
  REFUND_POLICY.approved &&
  OFFERS.foundingMember.approved
