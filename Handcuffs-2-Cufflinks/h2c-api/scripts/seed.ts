/**
 * Seeds the approved reference content.
 *
 * Idempotent: records are matched by slug and updated rather than duplicated,
 * so it is safe to re-run after a schema change.
 *
 * Refuses to touch a database whose connection string looks like production —
 * seeding over live content would overwrite a VA's work.
 *
 *   npm run seed
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { connectForScript } from '../src/db/connect';
import {
  ApparelCollection,
  ApparelItem,
  Artist,
  DocuseriesEpisode,
  GwopProgramme,
  Look,
  MusicRelease,
  PodcastClip,
  PodcastEpisode,
} from '../src/models/content';

const COLLECTIONS = [
  { slug: 'signature', name: 'Signature Collection', premise: 'The pieces the movement started with.', displayOrder: 1 },
  { slug: 'struggle', name: 'From Struggle to Success', premise: 'The distance, worn.', displayOrder: 2 },
  { slug: 'executive', name: 'Executive Streetwear', premise: 'Street cut, boardroom finish.', displayOrder: 3 },
  { slug: 'limited', name: 'Limited Drops', premise: 'One run, numbered.', displayOrder: 4 },
  { slug: 'accessories', name: 'Accessories', premise: 'The quiet way to wear it.', displayOrder: 5 },
  { slug: 'looks', name: 'Featured Looks', premise: 'Straight from the photoshoot.', displayOrder: 6 },
];

const APPAREL = [
  { slug: 'distance-hoodie', name: 'The Distance Hoodie', coll: 'signature', badge: 'Signature', story: 'Two words on the chest and the mileage on the sleeve. The first piece ever printed.', asset: 'H2C_Signature_DistanceHoodie_Front_3x4.jpg', likes: 1284, votes: 412 },
  { slug: 'cufflinks-tee', name: 'Cufflinks Tee', coll: 'signature', badge: 'Signature', story: 'Chrome type, gold two. The shirt people stop you about in the street.', asset: 'H2C_Signature_CufflinksTee_Worn_3x4.jpg', likes: 1876, votes: 604 },
  { slug: 'zakim-bomber', name: 'Zakim Bomber', coll: 'executive', badge: 'Executive', story: 'Streetwear cut, tailored shoulder. Built for the walk between the two versions of you.', asset: 'H2C_Executive_ZakimBomber_3x4.jpg', likes: 942, votes: 388 },
  { slug: 'legacy-crewneck', name: 'Legacy in Motion Crewneck', coll: 'struggle', badge: 'Struggle to Success', story: 'Emerald on obsidian. Heavyweight loopback, meant to outlast the season.', asset: 'H2C_Struggle_LegacyCrew_3x4.jpg', likes: 1104, votes: 521 },
  { slug: 'visiting-hours-longsleeve', name: 'Visiting Hours Longsleeve', coll: 'struggle', badge: 'Struggle to Success', story: 'Named for the room where a lot of these stories actually turned.', asset: 'H2C_Struggle_VisitingHours_3x4.jpg', likes: 768, votes: 295 },
  { slug: 'harbour-puffer', name: 'Boston Harbour Puffer', coll: 'limited', badge: 'Limited · 200', story: 'One run, numbered. Cold-weather piece for a cold-weather city.', asset: 'H2C_Limited_HarbourPuffer_3x4.jpg', likes: 1502, votes: 711 },
  { slug: 'gold-cufflinks', name: 'H2C Gold Cufflinks', coll: 'accessories', badge: 'Accessories', story: 'The literal version. Brushed brass, monogram face, boxed in emerald.', asset: 'H2C_Access_GoldCufflinks_1x1.jpg', likes: 2231, votes: 889 },
  { slug: 'movement-cap', name: 'Movement Cap', coll: 'accessories', badge: 'Accessories', story: 'Low crown, embroidered mark. The quiet way to wear it.', asset: 'H2C_Access_MovementCap_3x4.jpg', likes: 854, votes: 243 },
  { slug: 'look-08-suit', name: 'Look 08 Suit Study', coll: 'looks', badge: 'Featured Look', story: 'The tailoring from the final frame of the shoot. Made to order when it opens.', asset: 'H2C_Looks_Look08_Suit_3x4.jpg', likes: 1320, votes: 660 },
  { slug: 'charlestown-sweatsuit', name: 'Charlestown Sweatsuit', coll: 'looks', badge: 'Featured Look', story: 'Look 01, head to toe. Where every one of these stories starts.', asset: 'H2C_Looks_Look01_Sweatsuit_3x4.jpg', likes: 1189, votes: 474 },
  { slug: 'second-chance-overshirt', name: 'Second Chance Overshirt', coll: 'executive', badge: 'Executive', story: 'Workwear weight, boardroom collar. For the years that are both at once.', asset: 'H2C_Executive_SecondChance_3x4.jpg', likes: 690, votes: 207 },
  { slug: 'season-one-tee', name: 'Season One Anniversary Tee', coll: 'limited', badge: 'Limited · 300', story: 'Four episodes, four names on the back. Printed once.', asset: 'H2C_Limited_SeasonOneTee_3x4.jpg', likes: 977, votes: 355 },
];

const LOOKS = [
  { n: '01', title: 'Where it started', note: 'Navy sweatsuit, hood up, Charlestown at dusk.', pieces: ['Charlestown Sweatsuit', 'Movement Cap'] },
  { n: '02', title: 'The waiting room', note: 'Longsleeve and work trousers. The years in between.', pieces: ['Visiting Hours Longsleeve'] },
  { n: '03', title: 'First paycheck', note: 'The hoodie that started it, worn with intent.', pieces: ['The Distance Hoodie'] },
  { n: '04', title: 'The trade', note: 'Overshirt and boots. Hands that learned something.', pieces: ['Second Chance Overshirt'] },
  { n: '05', title: 'The turn', note: 'Bomber over the tee. Somewhere between the two.', pieces: ['Zakim Bomber', 'Cufflinks Tee'] },
  { n: '06', title: 'Public speaking', note: 'Crewneck under a coat. Telling it out loud.', pieces: ['Legacy in Motion Crewneck'] },
  { n: '07', title: 'The business', note: 'Puffer on the harbour. Building in the cold.', pieces: ['Boston Harbour Puffer'] },
  { n: '08', title: 'Where it goes', note: 'Full tailoring. Gold at the wrist.', pieces: ['Look 08 Suit Study', 'H2C Gold Cufflinks'] },
];

const EPISODES = [
  { slug: 'the-room-you-grow-up-in', n: '01', title: 'The room you grow up in', guest: 'Andre W. · Roxbury', line: 'Ten years inside, a barbershop of his own, and eight apprentices.', len: '26 min' },
  { slug: 'clean-for-the-ninth-time', n: '02', title: 'Clean for the ninth time', guest: 'Tasha M. · Lynn', line: 'Eight relapses. The ninth one held.', len: '31 min' },
  { slug: 'nobody-hires-a-record', n: '03', title: 'Nobody hires a record', guest: 'Devon P. · Mattapan', line: 'A CDL, a truck, and now a fleet of four.', len: '22 min' },
  { slug: 'the-room-you-leave-behind', n: '04', title: 'The room you leave behind', guest: 'Marcus B. · Dorchester', line: 'Line cook to licensed electrician, and the crew he built.', len: '24 min' },
  { slug: 'she-kept-the-letters', n: '05', title: 'She kept the letters', guest: 'Yvette C. · Brockton', line: 'What a mother holds while she waits.', len: '28 min' },
  { slug: 'the-first-ninety-days', n: '06', title: 'The first ninety days', guest: 'Reentry panel', line: 'What actually works when the gate opens.', len: '34 min' },
];

const CLIPS = [
  { quote: 'I stopped waiting for somebody to hand me a second chance and started building one.', attribution: 'Ep 31 · Angela Ruiz' },
  { quote: 'The hardest part was not the time. It was the first Monday after.', attribution: 'Ep 28 · Marcus Bell' },
  { quote: 'My son sees me leave for work now. That is the whole thing.', attribution: 'Ep 25 · Devon Price' },
  { quote: 'You cannot outrun where you came from. You can outbuild it.', attribution: 'Ep 22 · Tasha Moore' },
  { quote: 'Somebody picked up the phone when I called. That is why I pick up now.', attribution: 'Ep 19 · Yvette Cole' },
  { quote: 'The licence is the thing nobody can argue with.', attribution: 'Ep 16 · Andre Whitfield' },
];

const ARTISTS = [
  { slug: 'rell-santana', name: 'Rell Santana', city: 'Dorchester, MA', activeSince: '2019', biography: 'Writes like he is still in the room it happened in.' },
  { slug: 'nia-vaughn', name: 'Nia Vaughn', city: 'Roxbury, MA', activeSince: '2021', biography: 'Gospel-trained. The voice on most of the docuseries scoring.' },
  { slug: 'kb-third', name: 'KB Third', city: 'Brockton, MA', activeSince: '2017', biography: 'Producer first, artist second. Built the label sound.' },
];

const RELEASES = [
  { slug: 'the-distance', title: 'The Distance', artist: 'Rell Santana', type: 'album' as const, year: '2024', note: 'Eleven tracks written across four years and two addresses.' },
  { slug: 'visiting-hours', title: 'Visiting Hours', artist: 'Nia Vaughn', type: 'single' as const, year: '2025', note: 'The song that became the docuseries theme.' },
  { slug: 'kitchen-tapes-vol-1', title: 'Kitchen Tapes Vol. 1', artist: 'KB Third', type: 'mixtape' as const, year: '2023', note: 'Where the label sound was found.' },
];

const PROGRAMMES = [
  { slug: 'money-first-ninety-days', kind: 'Course' as const, name: 'Money in the First Ninety Days', length: '6 weeks', summary: 'Banking, budgeting, and paperwork for people starting over.' },
  { slug: 'trade-licensing', kind: 'Workshop' as const, name: 'Getting Licensed', length: '1 day', summary: 'Which trades license, what it costs, and how a record affects it.' },
  { slug: 'tell-your-story', kind: 'Seminar' as const, name: 'Tell Your Story First', length: '3 hours', summary: 'How to talk about your past in an interview before someone else does.' },
  { slug: 'one-adult', kind: 'Mentorship' as const, name: 'One Consistent Adult', length: 'Rolling', summary: 'Two hours a month, matched by trade, for young people who need one.' },
  { slug: 'reentry-partners', kind: 'Initiative' as const, name: 'Reentry Partners', length: 'Ongoing', summary: 'Working with houses of correction on the ninety days after release.' },
  { slug: 'youth-summer-build', kind: 'Course' as const, name: 'Summer Build', length: '8 weeks', summary: 'Paid summer programme teaching a trade to sixteen to nineteen year olds.' },
];

async function main(): Promise<void> {
  if (/prod/i.test(env.MONGODB_URI)) {
    console.error('\nRefusing to seed: the connection string looks like production.\n');
    process.exit(1);
  }

  await connectForScript();
  console.log(`\nSeeding ${mongoose.connection.name}\n`);

  const published = { status: 'published' as const, publishedAt: new Date() };
  const upsert = { upsert: true, new: true, setDefaultsOnInsert: true };

  const collectionIds = new Map<string, mongoose.Types.ObjectId>();
  for (const c of COLLECTIONS) {
    const doc = await ApparelCollection.findOneAndUpdate({ slug: c.slug }, { ...c, ...published }, upsert);
    collectionIds.set(c.slug, doc!._id as mongoose.Types.ObjectId);
  }
  console.log(`  ✓ ${COLLECTIONS.length} collections`);

  for (const a of APPAREL) {
    await ApparelItem.findOneAndUpdate(
      { slug: a.slug },
      {
        slug: a.slug, name: a.name, collectionId: collectionIds.get(a.coll), badge: a.badge,
        story: a.story, assetSpec: a.asset,
        wearYourStoryMessage: 'Wear the transformation.',
        // Seeded engagement reflects the approved reference figures so the CMS
        // dashboard is not empty during review.
        engagement: { likes: a.likes, votes: a.votes, favorites: 0, notifyMeCount: 0, shares: 0, views: 0 },
        ...published,
      },
      upsert
    );
  }
  console.log(`  ✓ ${APPAREL.length} apparel items`);

  for (const l of LOOKS) {
    await Look.findOneAndUpdate(
      { lookNumber: l.n },
      { lookNumber: l.n, title: l.title, statement: l.note, pieces: l.pieces, ...published },
      upsert
    );
  }
  console.log(`  ✓ ${LOOKS.length} photoshoot looks`);

  for (const e of EPISODES) {
    await DocuseriesEpisode.findOneAndUpdate(
      { slug: e.slug },
      {
        slug: e.slug, episodeNumber: e.n, seasonNumber: 1, title: e.title, teaser: e.line,
        runtimeLabel: e.len, guest: { name: e.guest, biography: '' },
        isFeatured: e.n === '04', ...published,
      },
      upsert
    );
  }
  console.log(`  ✓ ${EPISODES.length} docuseries episodes`);

  await PodcastEpisode.findOneAndUpdate(
    { slug: 'the-first-ninety-days-ep31' },
    {
      slug: 'the-first-ninety-days-ep31', episodeNumber: '31', title: 'The first ninety days',
      summary: 'A reentry counsellor, a former client, and the founder on what actually works.',
      keyTakeaways: [
        'Housing before hustle. Nothing holds without an address.',
        'One consistent adult changes the odds more than any programme.',
        'The paperwork is the barrier. Someone has to sit with you and do it.',
      ],
      durationSeconds: 4080, isFeatured: true, ...published,
    },
    upsert
  );
  console.log('  ✓ 1 podcast episode');

  for (const c of CLIPS) {
    await PodcastClip.findOneAndUpdate(
      { quote: c.quote },
      { ...c, placements: ['home', 'podcast'], ...published },
      upsert
    );
  }
  console.log(`  ✓ ${CLIPS.length} podcast clips`);

  const artistIds = new Map<string, mongoose.Types.ObjectId>();
  for (const a of ARTISTS) {
    const doc = await Artist.findOneAndUpdate({ slug: a.slug }, { ...a, ...published }, upsert);
    artistIds.set(a.name, doc!._id as mongoose.Types.ObjectId);
  }
  console.log(`  ✓ ${ARTISTS.length} artists`);

  for (const r of RELEASES) {
    await MusicRelease.findOneAndUpdate(
      { slug: r.slug },
      {
        slug: r.slug, title: r.title, type: r.type, note: r.note,
        artistNames: [r.artist],
        artistIds: [artistIds.get(r.artist)].filter(Boolean),
        releaseDate: new Date(`${r.year}-01-01`),
        isFeatured: r.slug === 'visiting-hours', ...published,
      },
      upsert
    );
  }
  console.log(`  ✓ ${RELEASES.length} music releases`);

  for (const p of PROGRAMMES) {
    await GwopProgramme.findOneAndUpdate({ slug: p.slug }, { ...p, ...published }, upsert);
  }
  console.log(`  ✓ ${PROGRAMMES.length} GWOP programmes`);

  await mongoose.disconnect();
  console.log('\nSeed complete.\n');
}

main().catch((error: unknown) => {
  console.error('\nSeed failed:', error);
  process.exit(1);
});
