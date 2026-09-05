/**
 * THE BLUEPRINT ROADMAPS.
 *
 * ✅ APPROVED — Felicia, 2026-08-25. This is her Condensed Event Version,
 * applied verbatim. She reviewed all nine, kept the five-section structure and
 * the nine paths as built, and rewrote the copy shorter for someone reading on
 * a phone immediately after finishing the assessment.
 *
 * Do not lengthen these. The brevity is the point — an attendee is standing at
 * a table with a queue behind them, not sitting down to read.
 *
 * ── STRUCTURE (Felicia, 2026-08-22) ─────────────────────────────────────────
 * Every roadmap answers the same five things in the same order:
 *   1. Where You Are
 *   2. What's Holding You Back
 *   3. Your Next 3 Moves
 *   4. What NOT to Do Yet
 *   5. Your GWOP Path
 *
 * The consistency is the product. Section four is the one nobody else gives
 * them — telling someone what to leave alone is worth as much as telling them
 * what to do.
 *
 * ── THE FRONT END STAYS SIMPLE ──────────────────────────────────────────────
 * Nine versions exist; the attendee never learns that.
 *
 * ── RULES THAT ARE NOT STYLE PREFERENCES ────────────────────────────────────
 * No score numbers. No funding amounts. No timelines. No guarantees. Note how
 * carefully Felicia hedged the claims — "may evaluate", "possible credit
 * impact", "appropriate for you". Keep that if anything is ever edited.
 */

export type BlueprintSlug =
  | 'credit-early'
  | 'credit-established'
  | 'funding-early'
  | 'funding-established'
  | 'business-early'
  | 'business-established'
  | 'wealth-early'
  | 'wealth-established'
  | 'foundation'

export interface Blueprint {
  readonly pending: boolean
  readonly headline: string
  readonly whereYouAre: string
  readonly holdingYouBack: string
  readonly nextMoves: readonly { readonly title: string; readonly detail: string }[]
  readonly notYet: readonly { readonly title: string; readonly detail: string }[]
  readonly path: string
}

/* ⚠ `path` NAMES A STAGE AND MUST TRACK THE RENAME.
   These read "Freshman — Foundation" until 2026-09-04 — missed when the levels
   became stages on 09-03. The blueprint screen sat directly below pathway cards
   saying "Stage 01 · Foundation", so the same page named the same thing two
   ways for a day.

   It is written as prose rather than read from PATHWAY because the values are
   not all single stages — some are transitions ("Stage 01 → Stage 02") and one
   is a full route. So a rename cannot reach here automatically: if the stages
   are renamed again, these nine strings change by hand in the same commit. */
export const blueprints = {
  foundation: {
    pending: false,
    headline: 'Start with a clear picture',
    whereYouAre:
      'You\'re at the starting point. Before choosing a credit, funding, business or wealth strategy, get clear on where you stand.',
    holdingYouBack:
      'Without a clear picture, it\'s easy to make the right moves in the wrong order.',
    nextMoves: [
      { title: 'Know your numbers', detail: 'Income, expenses, debt and savings.' },
      { title: 'Know what\'s reporting', detail: 'Review your credit reports, not just the scores.' },
      { title: 'Choose your priority', detail: 'Credit, cash flow, funding, business or wealth.' },
    ],
    notYet: [
      { title: 'Don\'t apply blindly', detail: 'Understand your profile and possible credit impact first.' },
      { title: 'Don\'t pay for a quick fix', detail: 'Know what actually needs attention first.' },
    ],
    path: 'Stage 01 — Foundation',
  },

  'credit-early': {
    pending: false,
    headline: 'Credit, from the ground up',
    whereYouAre:
      'You\'re rebuilding credit, not fine-tuning it. At this stage, the order of your moves matters.',
    holdingYouBack:
      'Adding new accounts before understanding what\'s already reporting can work against your progress.',
    nextMoves: [
      { title: 'Read the reports', detail: 'Know what\'s reporting and whether it appears accurate.' },
      { title: 'Separate the issues', detail: 'Errors and accurate negative history require different strategies.' },
      { title: 'Build consistency', detail: 'Focus on on-time payments and manageable balances.' },
    ],
    notYet: [
      { title: 'Don\'t open accounts just because you can', detail: 'New credit should have a purpose.' },
      { title: 'Don\'t chase guaranteed fixes', detail: 'Be cautious of promised scores or timelines.' },
    ],
    path: 'Stage 01 — Foundation',
  },

  'credit-established': {
    pending: false,
    headline: 'Credit, with something to protect',
    whereYouAre:
      'You have a credit foundation. Now the goal is protecting it while positioning for your next move.',
    holdingYouBack:
      'A score is only part of the picture. Lenders may evaluate your overall profile.',
    nextMoves: [
      { title: 'Audit your profile', detail: 'Review utilization, balances, history and inquiries.' },
      { title: 'Know the requirements', detail: 'Different products and lenders use different criteria.' },
      { title: 'Position before applying', detail: 'Prepare first instead of fixing problems afterward.' },
    ],
    notYet: [
      { title: 'Don\'t apply everywhere', detail: 'Unnecessary applications may add inquiries or accounts.' },
      { title: 'Don\'t add unnecessary obligations', detail: 'Keep your profile stable while preparing.' },
    ],
    path: 'Stage 02 — Readiness',
  },

  'funding-early': {
    pending: false,
    headline: 'Getting fundable',
    whereYouAre:
      'You want access to funding. Start with the profile a potential lender may evaluate — not the dollar amount you want.',
    holdingYouBack:
      'Searching for lenders before you\'re ready can lead to unnecessary applications and poor-fit products.',
    nextMoves: [
      { title: 'Know your profile', detail: 'Understand what a lender may see.' },
      { title: 'Strengthen the foundation', detail: 'Focus on credit, cash flow and organization.' },
      { title: 'Know the difference', detail: 'Understand personal vs. business funding and possible guarantees.' },
    ],
    notYet: [
      { title: 'Don\'t apply without a strategy', detail: 'Know the requirements and possible credit impact.' },
      { title: 'Don\'t chase guaranteed approvals', detail: 'Legitimate funding still requires evaluation.' },
    ],
    path: 'Stage 01 → Stage 02',
  },

  'funding-established': {
    pending: false,
    headline: 'Funding, positioned properly',
    whereYouAre:
      'You have a base. Now funding becomes about fit, preparation and timing.',
    holdingYouBack:
      'A strong profile doesn\'t guarantee the right outcome. Documentation, terms and lender requirements matter.',
    nextMoves: [
      { title: 'Understand both profiles', detail: 'Know where personal and business credit overlap.' },
      { title: 'Prepare your file', detail: 'Organize financials, records and business structure.' },
      { title: 'Apply intentionally', detail: 'Choose opportunities that fit your profile and goal.' },
    ],
    notYet: [
      { title: 'Don\'t take money just because it\'s available', detail: 'Understand cost and repayment terms.' },
      { title: 'Don\'t stack unnecessary applications', detail: 'Protect the profile you\'ve built.' },
    ],
    path: 'Stage 03 — Build + Scale',
  },

  'business-early': {
    pending: false,
    headline: 'Building the business properly',
    whereYouAre:
      'You\'re building something. A clean structure now makes the business easier to operate, document and eventually finance.',
    holdingYouBack:
      'Many businesses grow before their records and financial systems do.',
    nextMoves: [
      { title: 'Set up correctly', detail: 'Handle entity, registration and compliance needs.' },
      { title: 'Separate finances', detail: 'Use dedicated business banking and clean records.' },
      { title: 'Build deliberately', detail: 'Develop consistent bookkeeping, banking and business credit practices.' },
    ],
    notYet: [
      { title: 'Don\'t mix money by default', detail: 'Document personal contributions properly.' },
      { title: 'Don\'t buy every business tool', detail: 'Start with what you actually need.' },
    ],
    path: 'Stage 02 — Readiness',
  },

  'business-established': {
    pending: false,
    headline: 'Scaling what you\'ve started',
    whereYouAre:
      'The business is moving. Now strengthen the financial profile and systems behind the growth.',
    holdingYouBack:
      'Revenue matters, but clean records and documented cash flow help others understand the business.',
    nextMoves: [
      { title: 'Audit the business profile', detail: 'Know what banks and potential lenders may see.' },
      { title: 'Strengthen the records', detail: 'Keep banking and bookkeeping consistent.' },
      { title: 'Prepare before you need capital', detail: 'Give yourself time to compare options.' },
    ],
    notYet: [
      { title: 'Don\'t let spending outrun your records', detail: 'Keep documentation current.' },
      { title: 'Don\'t personally guarantee automatically', detail: 'Understand the obligation first.' },
    ],
    path: 'Stage 03 → Stage 04',
  },

  'wealth-early': {
    pending: false,
    headline: 'Building toward wealth',
    whereYouAre:
      'You\'re thinking beyond today\'s needs. First, build a foundation strong enough to support long-term growth.',
    holdingYouBack:
      'Without financial stability, unexpected expenses can interrupt bigger plans.',
    nextMoves: [
      { title: 'Know your position', detail: 'Understand income, expenses, debt, savings and credit.' },
      { title: 'Build a cushion', detail: 'Create emergency reserves appropriate for you.' },
      { title: 'Understand before investing', detail: 'Know the risk, cost, purpose and time horizon.' },
    ],
    notYet: [
      { title: 'Don\'t invest money you may need soon', detail: 'Match decisions to your timeline.' },
      { title: 'Don\'t follow what you can\'t explain', detail: 'Know where your money is going and why.' },
    ],
    path: 'Stage 01 — Foundation → Full GWOP Pathway',
  },

  'wealth-established': {
    pending: false,
    headline: 'Building on purpose',
    whereYouAre:
      'You have stability and want to put it to work. The focus now is intentional growth and protection.',
    holdingYouBack:
      'Growth without planning can leave otherwise strong finances exposed.',
    nextMoves: [
      { title: 'Protect what exists', detail: 'Review reserves, insurance and financial structure.' },
      { title: 'Use credit strategically', detail: 'Credit is a tool, not a substitute for cash flow.' },
      { title: 'Define the goal', detail: 'Give your wealth plan a purpose, timeline and priorities.' },
    ],
    notYet: [
      { title: 'Don\'t add complexity for appearance', detail: 'Understand the purpose and cost first.' },
      { title: 'Don\'t ignore protection while growing', detail: 'Build and protect together.' },
    ],
    path: 'Stage 04 — Legacy',
  },

} as const satisfies Record<BlueprintSlug, Blueprint>

/** True when every version has been signed off. Gates the page. */
export const BLUEPRINTS_APPROVED = Object.values(blueprints).every((b) => !b.pending)
