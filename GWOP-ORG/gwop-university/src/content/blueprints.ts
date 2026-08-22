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
  /** Blocks render until Surpaul signs off. */
  readonly pending: boolean
  /** Names their situation back to them before advising anything. */
  readonly headline: string
  readonly intro: string
  /** Three or four. Ordered — the first one is the next thing they do. */
  readonly steps: readonly { readonly title: string; readonly detail: string }[]
  /** One line, under the steps. What GWOP is for, in their context. */
  readonly closing: string
}

export const blueprints = {
  foundation: {
    pending: true,
    headline: 'Start with a clear picture',
    intro:
      'You told us you want direction more than any single fix. That is a reasonable place to begin, and it is more common than most people admit in a room like this.',
    steps: [
      {
        title: 'Find out what is actually on your report',
        detail:
          'Most decisions people make about their credit are made without reading it first. Knowing what is there changes what you should do next.',
      },
      {
        title: 'Put one month on paper',
        detail:
          'Money in, money out, for a single month. Not a budget yet — just the facts you are working with.',
      },
      {
        title: 'Pick one thing, not five',
        detail:
          'The people who make progress choose a single area and stay with it. The people who stall try to fix everything at once.',
      },
    ],
    closing:
      'GWOP University exists for the part that comes after knowing — the structure and the sequence.',
  },

  'credit-early': {
    pending: true,
    headline: 'Credit, from the ground up',
    intro:
      'You want to work on credit and you are rebuilding rather than optimising. The order matters more here than anywhere else.',
    steps: [
      {
        title: 'Read your report before changing anything',
        detail:
          'You cannot dispute what you have not seen, and you cannot plan around a balance you are guessing at.',
      },
      {
        title: 'Separate errors from accurate history',
        detail:
          'They are different problems with different routes. Treating accurate history as a paperwork issue wastes months.',
      },
      {
        title: 'Stabilise before you add anything',
        detail:
          'New accounts while the foundation is unsteady tends to undo the work. Steady first.',
      },
      {
        title: 'Build a routine you can hold',
        detail:
          'Consistency does more here than any single action. That is unglamorous and it is the truth.',
      },
    ],
    closing:
      'The Freshman level covers exactly this sequence, in this order.',
  },

  'credit-established': {
    pending: true,
    headline: 'Credit, with something to protect',
    intro:
      'You already have a foundation. The work now is protecting what you have built while positioning for what you want next.',
    steps: [
      {
        title: 'Audit what is reporting and how',
        detail:
          'At this stage the details matter — utilisation, ages, mix. Small structural things carry weight.',
      },
      {
        title: 'Understand what lenders read',
        detail:
          'Banks look at profiles, history and preparation. Knowing what they read changes what you present.',
      },
      {
        title: 'Position before you apply',
        detail:
          'Applying blind is the most common way people undo good work. Preparation comes first.',
      },
    ],
    closing:
      'This is where the Sophomore and Junior levels pick up.',
  },

  'funding-early': {
    pending: true,
    headline: 'Getting fundable',
    intro:
      'You want funding, and the honest first step is the profile it will be judged on. Banks do not read intentions.',
    steps: [
      {
        title: 'Know what your profile says right now',
        detail:
          'Funding decisions start from what is already reported about you. Read it before you plan around it.',
      },
      {
        title: 'Fix the foundation first',
        detail:
          'Applying before the profile is ready is how people collect denials that then sit on the record.',
      },
      {
        title: 'Understand what makes a file fundable',
        detail:
          'Structure, history, credibility and preparation. Each one is learnable and none of it is luck.',
      },
    ],
    closing:
      'GWOP University teaches the preparation, not the shortcut.',
  },

  'funding-established': {
    pending: true,
    headline: 'Funding, positioned properly',
    intro:
      'You have a base to work from. The question now is sequence — what you approach, in what order, with what prepared.',
    steps: [
      {
        title: 'Separate personal and business profiles',
        detail:
          'How they are structured changes what becomes available and on what terms.',
      },
      {
        title: 'Prepare the file before the conversation',
        detail:
          'The work happens before the application, not during it.',
      },
      {
        title: 'Sequence your approaches',
        detail:
          'Order affects outcome. Scattered applications leave a trail that works against you.',
      },
    ],
    closing:
      'The Junior and Senior levels cover funding readiness in depth.',
  },

  'business-early': {
    pending: true,
    headline: 'Building the business properly',
    intro:
      'You are building something. Getting the structure right early costs far less than correcting it later.',
    steps: [
      {
        title: 'Set the entity up correctly',
        detail:
          'The structure determines what the business can access on its own later.',
      },
      {
        title: 'Separate business from personal',
        detail:
          'Mixed finances are one of the most common reasons a business cannot be funded on its own record.',
      },
      {
        title: 'Start the business credit profile deliberately',
        detail:
          'It is built on purpose, in a sequence. It does not accumulate by accident.',
      },
    ],
    closing:
      'LLC setup, banking relationships and business credit are core to the programme.',
  },

  'business-established': {
    pending: true,
    headline: 'Scaling what you have started',
    intro:
      'The business exists. The work now is making it credible on its own record rather than resting on yours.',
    steps: [
      {
        title: 'Audit how the business reports',
        detail:
          'What lenders can see about the business, separate from you.',
      },
      {
        title: 'Strengthen banking relationships',
        detail:
          'History and consistency with a bank are assets. They are built over time and deliberately.',
      },
      {
        title: 'Prepare before you need the money',
        detail:
          'Funding sought under pressure is funding taken on someone else terms.',
      },
    ],
    closing:
      'The Senior level and the Capstone are built for this stage.',
  },

  'wealth-early': {
    pending: true,
    headline: 'Building toward wealth, from where you are',
    intro:
      'You are thinking beyond the immediate, which is the right instinct. The foundation still comes first.',
    steps: [
      {
        title: 'Know your position',
        detail:
          'What is coming in, what is going out, and what is reported about you. Everything else builds on that.',
      },
      {
        title: 'Build a cushion before building anything else',
        detail:
          'Without one, the first setback undoes the progress. This is the least exciting step and the one that decides the rest.',
      },
      {
        title: 'Learn the structures before using them',
        detail:
          'Money responds to structure. Understanding it first is cheaper than learning by mistake.',
      },
    ],
    closing:
      'The pathway runs from foundation through to the completed GWOP Blueprint.',
  },

  'wealth-established': {
    pending: true,
    headline: 'Building on purpose',
    intro:
      'You have stability and you want to put it to work. From here it is about structure and sequence rather than starting over.',
    steps: [
      {
        title: 'Protect what exists',
        detail:
          'Structure and protection come before growth. Growth on an unprotected base is fragile.',
      },
      {
        title: 'Use credit as a tool rather than a fallback',
        detail:
          'At this stage credit is leverage, and leverage rewards preparation.',
      },
      {
        title: 'Build with a plan you can name',
        detail:
          'Wealth built on purpose looks different from wealth accumulated by accident.',
      },
    ],
    closing:
      'This is what the completed Blueprint is for.',
  },
} as const satisfies Record<BlueprintSlug, Blueprint>

/** True when every version has been signed off. Gates the page. */
export const BLUEPRINTS_APPROVED = Object.values(blueprints).every((b) => !b.pending)
