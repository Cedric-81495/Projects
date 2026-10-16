import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { ApparelItem } from '../src/models/content.js';
import { Engagement } from '../src/models/engagement.js';

/**
 * Clears seeded engagement counts from a database that already has them.
 *
 * The seed script used to write invented likes and votes onto every apparel
 * record. Zeroing the script fixes the next seed; it does nothing to rows
 * already written, and those rows are what the site serves. This is the one-off
 * correction.
 *
 * Counters are rebuilt from the engagement log rather than simply set to zero,
 * so any genuine reactions cast since launch survive. A record with no log rows
 * lands at zero, which is the honest answer.
 *
 *   npm run reset-engagement              # against .env
 *   MONGODB_URI="<prod>" npm run reset-engagement
 *   npm run reset-engagement -- --dry-run # report only, write nothing
 */

const ACTIONS = ['like', 'favorite', 'vote', 'notify', 'share', 'view'] as const;

const FIELD: Record<(typeof ACTIONS)[number], string> = {
  like: 'likes',
  favorite: 'favorites',
  vote: 'votes',
  notify: 'notifyMeCount',
  share: 'shares',
  view: 'views',
};

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  await mongoose.connect(env.MONGODB_URI);
  console.log(`connected to ${mongoose.connection.name}${dryRun ? ' (dry run)' : ''}\n`);

  /** One pass over the log: how many real reactions exist, per item per action. */
  const counted = await Engagement.aggregate<{
    _id: { itemId: mongoose.Types.ObjectId; action: string };
    n: number;
  }>([{ $group: { _id: { itemId: '$itemId', action: '$action' }, n: { $sum: 1 } } }]);

  const real = new Map<string, Record<string, number>>();
  for (const row of counted) {
    const id = String(row._id.itemId);
    const forItem = real.get(id) ?? {};
    forItem[FIELD[row._id.action as (typeof ACTIONS)[number]]] = row.n;
    real.set(id, forItem);
  }

  const items = await ApparelItem.find({}).select('name slug engagement');
  let changed = 0;

  for (const item of items) {
    const id = String(item._id);
    const truth = real.get(id) ?? {};
    const next = Object.fromEntries(ACTIONS.map((a) => [FIELD[a], truth[FIELD[a]] ?? 0]));

    const current = (item.engagement ?? {}) as Record<string, number>;
    const drifted = Object.entries(next).filter(([k, v]) => (current[k] ?? 0) !== v);
    if (drifted.length === 0) continue;

    changed += 1;
    const before = drifted.map(([k]) => `${k} ${current[k] ?? 0}`).join(', ');
    const after = drifted.map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`${item.slug.padEnd(28)} ${before}  ->  ${after}`);

    if (!dryRun) {
      await ApparelItem.updateOne(
        { _id: item._id },
        { $set: Object.fromEntries(Object.entries(next).map(([k, v]) => [`engagement.${k}`, v])) }
      );
    }
  }

  console.log(
    `\n${items.length} apparel records, ${changed} ${dryRun ? 'would be corrected' : 'corrected'}.`
  );
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
