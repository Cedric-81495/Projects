import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { GwopProgramme } from '../src/models/content.js';

/**
 * Replaces the invented GWOP programmes in a database that already has them.
 *
 * The seed script used to write six programmes that do not exist — a summer
 * build, a licensing workshop, a reentry initiative — and the live site renders
 * them under a heading saying what is running now. Correcting the seed script
 * fixes the next seed and does nothing to rows already written, which are what
 * visitors actually see.
 *
 * The five below are what GWOP University sells. Anything else in the
 * collection is archived rather than deleted: if an operator has since entered
 * a real programme, this must not throw it away.
 *
 *   npm run fix-gwop-programmes              # against .env
 *   npm run fix-gwop-programmes -- --dry-run # report only, write nothing
 */

const REAL = [
  {
    slug: 'level-1-personal-credit',
    kind: 'Course',
    name: 'Level 1 — Personal Credit',
    length: 'Self-paced',
    summary:
      'What a lender sees before they see you. Reading your reports, the five pillars they weigh, and the cleanup order that protects your score.',
  },
  {
    slug: 'level-2-business-foundation',
    kind: 'Course',
    name: 'Level 2 — Business Foundation & Business Credit',
    length: 'Self-paced',
    summary:
      'Structure first. The entity, the paperwork behind it, and building a business profile that stands on its own.',
  },
  {
    slug: 'level-3-funding-banking',
    kind: 'Course',
    name: 'Level 3 — Funding & Banking Strategy',
    length: 'Self-paced',
    summary:
      'Banking relationships, how underwriting actually decides, and being ready before you apply rather than after.',
  },
  {
    slug: 'level-4-execution-capital',
    kind: 'Course',
    name: 'Level 4 — Execution, Capital & Wealth Strategy',
    length: 'Self-paced',
    summary:
      'What happens after the money arrives. Deploying capital, managing cash flow, and moving from borrower to lender.',
  },
  {
    slug: 'blueprint-one-to-one',
    kind: 'Mentorship',
    name: 'The Blueprint 1:1',
    length: 'One hour',
    summary:
      'A session with Beast walking through your own roadmap, rather than a course telling everybody the same thing.',
  },
] as const;

/** The six the old seed wrote. Only these are retired, by slug. */
const SEEDED_PLACEHOLDERS = [
  'money-first-ninety-days',
  'trade-licensing',
  'tell-your-story',
  'one-adult',
  'reentry-partners',
  'youth-summer-build',
];

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  await mongoose.connect(env.MONGODB_URI);
  console.log(`connected to ${mongoose.connection.name}${dryRun ? ' (dry run)' : ''}\n`);

  for (const [index, programme] of REAL.entries()) {
    const existing = await GwopProgramme.findOne({ slug: programme.slug });
    console.log(`${existing ? 'update' : 'create'}  ${programme.name}`);
    if (dryRun) continue;

    await GwopProgramme.updateOne(
      { slug: programme.slug },
      {
        $set: { ...programme, displayOrder: index },
        /**
         * Published on insert only. If an operator has unpublished one
         * deliberately, this must not quietly put it back on the site.
         */
        $setOnInsert: { status: 'published', publishedAt: new Date() },
      },
      { upsert: true }
    );
  }

  console.log('');
  for (const slug of SEEDED_PLACEHOLDERS) {
    const found = await GwopProgramme.findOne({ slug });
    if (!found) continue;
    console.log(`archive ${found.name}`);
    if (!dryRun) {
      await GwopProgramme.updateOne({ slug }, { $set: { status: 'archived' } });
    }
  }

  const live = await GwopProgramme.countDocuments({ status: 'published' });
  console.log(`\n${dryRun ? 'would leave' : 'now live'}: ${live} published programmes.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
