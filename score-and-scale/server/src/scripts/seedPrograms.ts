import { connectDatabase, disconnectDatabase } from '../lib/db'
import { logger } from '../lib/logger'
import { Lesson } from '../models/Lesson'
import { Program } from '../models/Program'

/**
 * Idempotent seed for the pricing tiers shown on the funnel page and the
 * starter academy curriculum. Safe to re-run: everything upserts on its slug,
 * so existing records are updated rather than duplicated.
 */

const programs = [
  {
    slug: 'foundation',
    name: 'Foundation',
    tagline: 'Get your profile lender-ready',
    description:
      'A guided audit of your personal and business credit profile, plus the exact remediation steps that move your score fastest.',
    priceCents: 149_700,
    features: [
      'Full credit profile audit',
      'Personalised 90-day action plan',
      'Dispute letter templates',
      'Business entity structuring review',
      'Email support',
    ],
    highlighted: false,
    sortOrder: 1,
  },
  {
    slug: 'accelerator',
    name: 'Accelerator',
    tagline: 'Build the profile lenders approve',
    description:
      'Everything in Foundation, plus hands-on tradeline strategy and a dedicated advisor working your file with you every fortnight.',
    priceCents: 349_700,
    features: [
      'Everything in Foundation',
      'Dedicated advisor, fortnightly calls',
      'Tradeline and utilisation strategy',
      'Lender-matching shortlist',
      'Document review and preparation',
      'Priority support',
    ],
    highlighted: true,
    sortOrder: 2,
  },
  {
    slug: 'scale',
    name: 'Scale',
    tagline: 'Position for serious capital',
    description:
      'For operators ready to raise. We prepare the full funding package and introduce you to lenders matched to your profile.',
    priceCents: 749_700,
    features: [
      'Everything in Accelerator',
      'Full funding package preparation',
      'Direct lender introductions',
      'Weekly advisor calls',
      'Ongoing profile monitoring',
      'Dedicated account manager',
    ],
    highlighted: false,
    sortOrder: 3,
  },
]

const lessons = [
  {
    slug: 'how-credit-scoring-actually-works',
    title: 'How credit scoring actually works',
    summary: 'The five factors, how they are weighted, and which ones you can move quickly.',
    module: 'Fundamentals',
    moduleOrder: 1,
    lessonOrder: 1,
    durationMinutes: 14,
    programSlugs: [],
    content:
      'Credit scoring is far less mysterious than it is made out to be. Five factors account for almost all of your score, and they are not weighted equally.\n\nPayment history is the single largest component. Utilisation is the one you can move fastest — often within a single billing cycle. Length of history, credit mix, and new enquiries matter, but they move slowly and are rarely where the quick wins are.\n\nThe practical consequence: if you need a change in 60 days, you work on utilisation and derogatory marks. Everything else is a longer game.',
  },
  {
    slug: 'reading-your-report-like-an-underwriter',
    title: 'Reading your report like an underwriter',
    summary: 'What a lender looks at first, and the lines that quietly sink applications.',
    module: 'Fundamentals',
    moduleOrder: 1,
    lessonOrder: 2,
    durationMinutes: 18,
    programSlugs: [],
    content:
      'An underwriter does not read your report top to bottom. They look for disqualifiers first, then capacity, then character.\n\nDisqualifiers are recent derogatories, unresolved collections, and thin file depth. Capacity is your income against existing obligations. Character, in practice, is your payment pattern over the last 24 months.\n\nLearning to read in that order tells you which items on your report actually matter and which are noise.',
  },
  {
    slug: 'separating-personal-and-business-credit',
    title: 'Separating personal and business credit',
    summary: 'Entity structure, EIN, and why commingling limits how much you can raise.',
    module: 'Business Structure',
    moduleOrder: 2,
    lessonOrder: 1,
    durationMinutes: 22,
    programSlugs: ['accelerator', 'scale'],
    content:
      'Most owners cap their own borrowing capacity by never separating the two profiles.\n\nA properly structured entity with its own EIN, bank accounts, and trade references builds a credit identity that stands on its own. Until that exists, every application is underwritten against you personally, and your personal utilisation becomes the ceiling on the business.\n\nThis lesson walks the structure end to end, in the order it should be built.',
  },
  {
    slug: 'building-your-funding-package',
    title: 'Building your funding package',
    summary: 'The document set lenders expect, and how presentation changes the outcome.',
    module: 'Raising Capital',
    moduleOrder: 3,
    lessonOrder: 1,
    durationMinutes: 26,
    programSlugs: ['scale'],
    content:
      'Two businesses with identical numbers get different answers depending on how the package is assembled.\n\nA complete package answers the underwriter’s questions before they are asked: clean financials, a coherent use-of-funds, and reconciled bank statements. An incomplete one invites scrutiny, and scrutiny costs you time and terms.\n\nWe cover the full checklist and the order to assemble it in.',
  },
]

async function main(): Promise<void> {
  await connectDatabase()

  for (const program of programs) {
    await Program.findOneAndUpdate(
      { slug: program.slug },
      { $set: program },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    logger.info('Seeded program', { slug: program.slug })
  }

  for (const lesson of lessons) {
    await Lesson.findOneAndUpdate(
      { slug: lesson.slug },
      { $set: lesson },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    logger.info('Seeded lesson', { slug: lesson.slug })
  }

  logger.info('Seed complete', { programs: programs.length, lessons: lessons.length })
  await disconnectDatabase()
}

main().catch(async (error: unknown) => {
  logger.error('Seed failed', {
    error: error instanceof Error ? error.message : String(error),
  })
  await disconnectDatabase()
  process.exit(1)
})
