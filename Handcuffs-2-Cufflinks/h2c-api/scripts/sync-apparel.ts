import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { ApparelCollection, ApparelItem } from '../src/models/content.js';

/**
 * Replaces the seeded demo apparel with the real inventory.
 *
 * The database holds twelve invented pieces from the original seed, so the
 * live site shows those while a local build shows the twenty-two real designs
 * from the fallback. Correcting the seed script fixes the next seed and does
 * nothing to rows already written, which are what visitors see.
 *
 * Names and stories are holding text. `story` is required by the schema and
 * the guide — every piece carries its meaning — so a record cannot exist
 * without one, and inventing meanings for somebody else's designs would be
 * worse than saying plainly that they are not written yet.
 *
 * Collection is Signature on all of them because none has been assigned. One
 * honest bucket beats a guess spread across six, and reassigning later is a
 * dropdown per record in the CMS.
 *
 *   npm run sync-apparel              # against .env
 *   npm run sync-apparel -- --dry-run # report only, write nothing
 *   npm run sync-apparel -- --no-images   # create records without image paths
 */

interface Design {
  garment: 'Hoodie' | 'Jacket' | 'LongSleeve' | 'Tuxedo';
  colourKey?: string;
  colourLabel?: string;
  design: number;
  shots: number;
}

const GARMENT_LABEL: Record<Design['garment'], string> = {
  Hoodie: 'Hoodie',
  Jacket: 'Jacket',
  LongSleeve: 'Long Sleeve',
  Tuxedo: 'Tuxedo',
};

/** The inventory as delivered: 22 designs, 103 photographs. */
const INVENTORY: [Design['garment'], string | null, string | null, number[]][] = [
  ['Hoodie', 'Black', 'Black', [4, 2, 5, 3]],
  ['Hoodie', 'Cream', 'Cream', [3]],
  ['Hoodie', 'Gold', 'Gold', [2]],
  ['Hoodie', 'Gray', 'Gray', [5, 4, 5]],
  ['Hoodie', 'NavyBlue', 'Navy Blue', [3, 4]],
  ['Hoodie', 'OliveGreen', 'Olive Green', [7]],
  ['Hoodie', 'Orange', 'Orange', [5]],
  ['Hoodie', 'Pink', 'Pink', [5]],
  ['Hoodie', 'Red', 'Red', [5]],
  ['Hoodie', 'RoyalBlue', 'Royal Blue', [14]],
  ['Jacket', null, null, [3, 6]],
  ['LongSleeve', null, null, [1, 1, 1]],
  ['Tuxedo', null, null, [15]],
];

function designs(): Design[] {
  const out: Design[] = [];
  for (const [garment, colourKey, colourLabel, shots] of INVENTORY) {
    shots.forEach((count, index) => {
      out.push({
        garment,
        colourKey: colourKey ?? undefined,
        colourLabel: colourLabel ?? undefined,
        design: index + 1,
        shots: count,
      });
    });
  }
  return out;
}

const fileBase = (d: Design): string =>
  d.colourKey
    ? `H2C_${d.garment}_${d.colourKey}_D${d.design}`
    : `H2C_${d.garment}_D${d.design}`;

const displayName = (d: Design): string =>
  d.colourLabel
    ? `${d.colourLabel} ${GARMENT_LABEL[d.garment]} ${String(d.design).padStart(2, '0')}`
    : `${GARMENT_LABEL[d.garment]} ${String(d.design).padStart(2, '0')}`;

const slugify = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const noImages = process.argv.includes('--no-images');

  await mongoose.connect(env.MONGODB_URI);
  console.log(`connected to ${mongoose.connection.name}${dryRun ? ' (dry run)' : ''}\n`);

  const signature = await ApparelCollection.findOne({ slug: 'signature' });
  if (!signature) {
    throw new Error('No collection with slug "signature". Seed the collections first.');
  }

  const all = designs();
  const wanted = new Set(all.map((d) => slugify(displayName(d))));

  for (const [index, d] of all.entries()) {
    const name = displayName(d);
    const slug = slugify(name);
    const base = fileBase(d);

    /**
     * Only the shots that exist are attached. A design with one photograph
     * gets one image, so the grid's hover has nothing to reveal and correctly
     * does not react.
     */
    const images = noImages
      ? []
      : Array.from({ length: Math.min(d.shots, 6) }, (_, i) => ({
          kind: 'image' as const,
          url: `/media/${base}_S${i + 1}_3x4.jpg`,
          alt: `${name}, shot ${i + 1}`,
        }));

    const existing = await ApparelItem.findOne({ slug });
    console.log(`${existing ? 'update' : 'create'}  ${name.padEnd(28)} ${images.length} image(s)`);
    if (dryRun) continue;

    await ApparelItem.updateOne(
      { slug },
      {
        $set: {
          name,
          collectionId: signature._id,
          badge: GARMENT_LABEL[d.garment],
          story: 'Meaning to be written.',
          images,
          displayOrder: index,
        },
        /** Published on insert only, so a deliberate unpublish is not undone. */
        $setOnInsert: { status: 'published', publishedAt: new Date() },
      },
      { upsert: true }
    );
  }

  /**
   * Everything else is archived rather than deleted. If an operator has edited
   * one of the seeded pieces into something real, this must not destroy it.
   */
  console.log('');
  const others = await ApparelItem.find({ slug: { $nin: [...wanted] } }).select('name slug status');
  for (const item of others) {
    if (item.status === 'archived') continue;
    console.log(`archive ${item.name}`);
    if (!dryRun) await ApparelItem.updateOne({ _id: item._id }, { $set: { status: 'archived' } });
  }

  const live = await ApparelItem.countDocuments({ status: 'published' });
  console.log(`\n${dryRun ? 'would leave' : 'now live'}: ${live} published pieces.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
