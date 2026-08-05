/**
 * Seed the content collections so the GET endpoints return real data.
 * Run once (or after content changes):  npm run seed
 * Mirrors the frontend seed in h2c-web/src/data/content.ts.
 */
import { connectDB, disconnectDB } from '../db/connect.js';
import { StoryModel } from '../models/Story.js';
import { EpisodeModel } from '../models/Episode.js';
import { TrackModel } from '../models/Track.js';

const stories = [
  { slug: 's-01', title: 'The First Knot', guest: 'Marcus Vale', chapter: 'Docuseries · Ep. 01', duration: '22 min', blurb: 'A returning citizen learns to tie a tie the morning of his first interview in eleven years.', order: 1 },
  { slug: 's-02', title: 'Room to Grow', guest: 'Deja Okafor', chapter: 'Docuseries · Ep. 02', duration: '18 min', blurb: 'From a shared halfway house to a kitchen of her own, one plate at a time.', order: 2 },
  { slug: 's-03', title: 'Second Shift', guest: 'Ray Delgado', chapter: 'Docuseries · Ep. 03', duration: '26 min', blurb: 'A father rebuilds trust on the night shift, teaching his son the trade that saved him.', order: 3 },
];

const episodes = [
  { slug: 'p-12', number: '012', title: 'What the Yard Taught Me About Patience', guest: 'w/ Andre Boone', duration: '54 min', order: 1 },
  { slug: 'p-11', number: '011', title: 'Hiring the Formerly Incarcerated', guest: 'w/ Lena Marsh', duration: '48 min', order: 2 },
  { slug: 'p-10', number: '010', title: 'Fatherhood After a Sentence', guest: 'w/ Ray Delgado', duration: '61 min', order: 3 },
];

const tracks = [
  { slug: 't-01', title: 'Cufflink (Intro)', artist: 'Kitchen Muzik', length: '2:41', order: 1 },
  { slug: 't-02', title: 'Free Hands', artist: 'Kitchen Muzik ft. J. Rowe', length: '3:58', order: 2 },
  { slug: 't-03', title: 'Halfway', artist: 'Kitchen Muzik', length: '4:12', order: 3 },
  { slug: 't-04', title: 'Suit & Scars', artist: 'Kitchen Muzik', length: '3:27', order: 4 },
];

async function upsertAll<T extends { slug: string }>(
  model: { updateOne: (f: object, u: object, o: object) => { exec: () => Promise<unknown> } },
  docs: T[],
) {
  for (const doc of docs) {
    await model.updateOne({ slug: doc.slug }, { $set: doc }, { upsert: true }).exec();
  }
}

async function run() {
  await connectDB();
  await upsertAll(StoryModel as never, stories);
  await upsertAll(EpisodeModel as never, episodes);
  await upsertAll(TrackModel as never, tracks);
  console.log(`✅ Seeded ${stories.length} stories, ${episodes.length} episodes, ${tracks.length} tracks.`);
  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
