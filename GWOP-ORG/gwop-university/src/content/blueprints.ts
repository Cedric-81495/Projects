/**
 * THE ROADMAP COPY.
 *
 * ⚠ DRAFT — NOT APPROVED. Every version below is `pending: true`, which means
 * the Blueprint page will not render it to an attendee. Same mechanism the
 * consent wording uses: unapproved text cannot reach a real person by accident.
 *
 * These are drafted from the language already approved in the About GWOP deck —
 * "a step-by-step strategy to understand credit, build structure, and stop
 * guessing" — so Surpaul is editing rather than authoring, which is usually the
 * difference between copy landing on time and not.
 *
 * ── RULES THAT ARE NOT STYLE PREFERENCES ─────────────────────────────────────
 * No score numbers. No funding amounts. No timelines. No guarantees. Nothing
 * that reads as a promise about an outcome. This is a credit-adjacent business
 * speaking to people in financial difficulty, and a sentence like "raise your
 * score 80 points" is a claim someone can be held to.
 *
 * Say what to DO, not what will HAPPEN.
 * ─────────────────────────────────────────────────────────────────────────────
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
  /** One line. Names their situation back to them before advising anything. */
  readonly headline: string
  readonly whereYouAre: string
  readonly holdingYouBack: string
  /** Exactly three. Ordered — the first is the next thing they physically do. */
  readonly nextMoves: readonly { readonly title: string; readonly detail: string }[]
  /** Two or three. What to leave alone for now, and why. */
  readonly notYet: readonly { readonly title: string; readonly detail: string }[]
  /** Which level of the pathway they belong in, and what happens next. */
  readonly path: string
}

export const blueprints = {
  foundation: {
    pending: true,
    headline: 'Start with a clear picture',
    whereYouAre:
      'You want direction more than any single fix. That is a more common place to be than anyone in a room like this says out loud, and it is a reasonable place to begin.',
    holdingYouBack:
      'Without a clear picture of where things stand, every decision is a guess. Most people here are not doing the wrong things — they are doing reasonable things in the wrong order.',
    nextMoves: [
      { title: 'Read your credit report', detail: 'Not the score, the report. Most decisions people make about their credit are made without reading it first.' },
      { title: 'Put one month on paper', detail: 'Money in, money out, for a single month. Not a budget yet — just the facts you are actually working with.' },
      { title: 'Choose one area, not five', detail: 'The people who make progress pick one thing and stay with it. The people who stall try to fix everything at once.' },
    ],
    notYet: [
      { title: 'Do not apply for anything', detail: 'Applications leave a record. Applying before you know your position is how people collect denials that then sit on the file.' },
      { title: 'Do not pay anyone to fix it yet', detail: 'Until you have read the report, you cannot judge whether an offer to fix it is worth anything.' },
    ],
    path: 'Freshman — Foundation. Credit, cash flow, banking and debt, in that order.',
  },

  'credit-early': {
    pending: true,
    headline: 'Credit, from the ground up',
    whereYouAre:
      'You want to work on credit, and you are rebuilding rather than fine-tuning. The order matters more here than anywhere else in your finances.',
    holdingYouBack:
      'Rebuilding is slow when it is done out of sequence, and most people are handed the steps in the wrong order — or handed the last one first.',
    nextMoves: [
      { title: 'Read the report before changing anything', detail: 'You cannot dispute what you have not seen, and you cannot plan around a balance you are guessing at.' },
      { title: 'Separate errors from accurate history', detail: 'Different problems, different routes. Treating accurate history as a paperwork problem wastes months.' },
      { title: 'Build one habit you can hold', detail: 'One payment, one date, every month. Consistency does more here than any single dramatic action.' },
    ],
    notYet: [
      { title: 'Do not open new accounts', detail: 'New credit while the foundation is unsteady tends to undo the work rather than speed it up.' },
      { title: 'Do not close old accounts', detail: 'It feels like tidying. It usually costs you the thing that was quietly helping.' },
      { title: 'Do not pay for a quick fix', detail: 'Anyone promising a specific number by a specific date is describing something they do not control.' },
    ],
    path: 'Freshman — Foundation. This is exactly what the first level covers, in this sequence.',
  },

  'credit-established': {
    pending: true,
    headline: 'Credit, with something to protect',
    whereYouAre:
      'You already have a foundation. The work now is protecting what you have built while positioning for whatever comes next.',
    holdingYouBack:
      'At this stage the obstacle is rarely damage. It is that the profile has never been read the way a lender reads it.',
    nextMoves: [
      { title: 'Audit how it reports', detail: 'Utilisation, account ages, mix. Small structural details carry real weight at this stage.' },
      { title: 'Learn what lenders actually read', detail: 'Banks look at profiles, history, credibility and preparation. Knowing what they read changes what you put in front of them.' },
      { title: 'Position before you approach', detail: 'The work happens before the application, not during it.' },
    ],
    notYet: [
      { title: 'Do not apply broadly to see what sticks', detail: 'Scattered applications leave a trail that works against the next one.' },
      { title: 'Do not add new obligations mid-preparation', detail: 'Anything new changes the picture at exactly the point you want it steady.' },
    ],
    path: 'Sophomore — Readiness. Business setup, records and funding readiness.',
  },

  'funding-early': {
    pending: true,
    headline: 'Getting fundable',
    whereYouAre:
      'You want funding, and the honest starting point is the profile it will be judged on rather than the amount you have in mind.',
    holdingYouBack:
      'Funding decisions are made from what is already reported about you. Most people discover that by being declined.',
    nextMoves: [
      { title: 'Find out what your profile says now', detail: 'Before any plan, read what a lender would see. Cheapest step there is, and it changes the rest.' },
      { title: 'Fix the foundation first', detail: 'Structure, history and consistency are what make a file fundable. None of it is luck and all of it is learnable.' },
      { title: 'Separate personal from business', detail: 'How the two are structured determines what becomes available, and on what terms.' },
    ],
    notYet: [
      { title: 'Do not apply yet', detail: 'Applying before the profile is ready is how people collect denials that sit on the record and make the next attempt harder.' },
      { title: 'Do not chase a guaranteed approval', detail: 'Anyone guaranteeing approval before seeing your file is selling something other than funding.' },
    ],
    path: 'Freshman, then Sophomore. The preparation rather than the shortcut.',
  },

  'funding-established': {
    pending: true,
    headline: 'Funding, positioned properly',
    whereYouAre:
      'You have a base to work from. The question now is sequence — what you approach, in what order, with what prepared.',
    holdingYouBack:
      'At this stage the limit is usually presentation rather than position. Good files get declined for being approached in the wrong order.',
    nextMoves: [
      { title: 'Separate the two profiles properly', detail: 'What the business can access on its own record, versus what still rests on you.' },
      { title: 'Prepare the file before the conversation', detail: 'Records, structure and consistency assembled first. The meeting is not where the work happens.' },
      { title: 'Sequence your approaches', detail: 'Order affects outcome. One prepared approach beats five hopeful ones.' },
    ],
    notYet: [
      { title: 'Do not take funding under pressure', detail: 'Money sought urgently is money taken on someone else\u2019s terms.' },
      { title: 'Do not stack applications', detail: 'Several at once reads as distress, whatever the reality is.' },
    ],
    path: 'Junior — Build + Scale. Revenue, capital, systems and protection.',
  },

  'business-early': {
    pending: true,
    headline: 'Building the business properly',
    whereYouAre:
      'You are building something. Getting the structure right early costs far less than correcting it later.',
    holdingYouBack:
      'Most early businesses are structured by accident, and the correction costs more than the setup would have.',
    nextMoves: [
      { title: 'Set the entity up correctly', detail: 'The structure determines what the business can access on its own later.' },
      { title: 'Separate business from personal', detail: 'Mixed finances are one of the most common reasons a business cannot be funded on its own record.' },
      { title: 'Start the business credit profile deliberately', detail: 'It is built on purpose, in a sequence. It does not accumulate by itself.' },
    ],
    notYet: [
      { title: 'Do not fund the business personally by default', detail: 'It is the fastest route, and the one that ties the two together for years.' },
      { title: 'Do not buy tools before you have records', detail: 'Software does not fix bookkeeping that has not started.' },
    ],
    path: 'Sophomore — Readiness. LLC setup, banking relationships, records.',
  },

  'business-established': {
    pending: true,
    headline: 'Scaling what you have started',
    whereYouAre:
      'The business exists and it is moving. The work now is making it credible on its own record rather than resting on yours.',
    holdingYouBack:
      'A business that cannot be assessed separately from its owner is a business that borrows on the owner\u2019s terms.',
    nextMoves: [
      { title: 'Audit how the business reports', detail: 'What a lender can see about the business, separately from you.' },
      { title: 'Strengthen the banking relationship', detail: 'History and consistency with a bank are assets. Built deliberately, and over time.' },
      { title: 'Prepare before you need the money', detail: 'The best terms go to the businesses that were ready before they asked.' },
    ],
    notYet: [
      { title: 'Do not scale spending ahead of records', detail: 'Growth without documentation is growth you cannot prove to anyone who matters.' },
      { title: 'Do not personally guarantee out of habit', detail: 'Sometimes necessary, rarely examined. Worth knowing when you are choosing it.' },
    ],
    path: 'Senior — Legacy, and the Capstone. Assets, protection, long-term wealth.',
  },

  'wealth-early': {
    pending: true,
    headline: 'Building toward wealth, from where you are',
    whereYouAre:
      'You are thinking past the immediate, which is the right instinct. The foundation still comes first — that is not a delay, it is what makes the rest hold.',
    holdingYouBack:
      'Building on an unprotected base means the first setback undoes the progress, and it happens quietly enough that people blame themselves for it.',
    nextMoves: [
      { title: 'Know your position', detail: 'What comes in, what goes out, and what is reported about you. Everything else builds on that.' },
      { title: 'Build a cushion before building anything else', detail: 'The least exciting step, and the one that decides whether the rest survives.' },
      { title: 'Learn the structures before using them', detail: 'Money responds to structure. Understanding it first is cheaper than learning by mistake.' },
    ],
    notYet: [
      { title: 'Do not invest money you may need soon', detail: 'Investing before a cushion exists usually means selling at the worst possible moment.' },
      { title: 'Do not follow a strategy you cannot explain', detail: 'If you cannot say why it works, you cannot tell when it has stopped working.' },
    ],
    path: 'Freshman — Foundation, then the full pathway.',
  },

  'wealth-established': {
    pending: true,
    headline: 'Building on purpose',
    whereYouAre:
      'You have stability and you want to put it to work. From here it is structure and sequence rather than starting over.',
    holdingYouBack:
      'Growth on an unprotected base is fragile, and protection is the step most people skip precisely because nothing appears to be wrong.',
    nextMoves: [
      { title: 'Protect what already exists', detail: 'Structure and protection come before growth, not after it.' },
      { title: 'Use credit as a tool rather than a fallback', detail: 'At this stage credit is leverage, and leverage rewards preparation.' },
      { title: 'Build to a plan you can name', detail: 'Wealth built on purpose looks different from wealth that simply accumulated.' },
    ],
    notYet: [
      { title: 'Do not add complexity for its own sake', detail: 'Structures you do not fully understand cost more to unwind than they ever saved.' },
      { title: 'Do not skip the protection step', detail: 'The one nobody regrets, and the one everybody postpones.' },
    ],
    path: 'Senior — Legacy, and the completed GWOP Blueprint.',
  },
} as const satisfies Record<BlueprintSlug, Blueprint>

/** True when every version has been signed off. Gates the page. */
export const BLUEPRINTS_APPROVED = Object.values(blueprints).every((b) => !b.pending)
