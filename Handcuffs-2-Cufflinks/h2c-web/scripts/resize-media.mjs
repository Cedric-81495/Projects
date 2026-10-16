/**
 * Resizes everything in public/media for the web.
 *
 * The delivered photographs are 8000px camera files, 9–39 MB each. The site
 * never shows an image wider than about 1440 CSS pixels, so a 1600px long edge
 * is still more than any screen renders — and it is roughly forty times
 * smaller.
 *
 * Writes to a separate folder rather than overwriting. Nothing is destroyed if
 * the output looks wrong, and the originals stay available until you choose to
 * replace them.
 *
 *   npm i -D sharp
 *   node resize-media.mjs
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const SRC = 'public/media';
const OUT = 'public/media-resized';

/** Long edge in pixels. Covers a 1440px slot on a 2x retina screen. */
const MAX = 1600;
const QUALITY = 80;

const KB = (n) => `${Math.round(n / 1024)} KB`;
const MB = (n) => `${(n / 1_048_576).toFixed(1)} MB`;

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (files.length === 0) {
  console.log(`No jpg or png files in ${SRC}.`);
  process.exit(0);
}

let before = 0;
let after = 0;

for (const file of files) {
  const src = join(SRC, file);
  const sizeBefore = (await stat(src)).size;

  /**
   * webp and svg are left alone: the crests and wordmark are already small and
   * re-encoding a vector or a tuned webp only loses quality.
   */
  const out = join(OUT, file.replace(extname(file), '.jpg'));

  await sharp(src)
    .rotate() // honour EXIF orientation before resizing
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(out);

  const sizeAfter = (await stat(out)).size;
  before += sizeBefore;
  after += sizeAfter;

  console.log(`${file.padEnd(42)} ${MB(sizeBefore).padStart(8)} -> ${KB(sizeAfter).padStart(8)}`);
}

console.log(
  `\n${files.length} files: ${MB(before)} -> ${MB(after)}  (${Math.round(before / after)}x smaller)`
);
console.log(`\nOutput is in ${OUT}. Check it, then replace ${SRC} with it.`);
