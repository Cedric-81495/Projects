import { env } from '@/config/env';

/**
 * Cloudinary delivery.
 *
 * The CMS stores whole delivery addresses, so this module's main job is to
 * insert a transformation into an address that already exists rather than to
 * build one from parts. Anything that is not a Cloudinary URL passes through
 * untouched — the media library still accepts assets hosted elsewhere, and a
 * helper that mangled those would be worse than no helper.
 *
 * Two transformations are always applied:
 *
 *   f_auto — serve AVIF or WebP to browsers that take them, JPEG to the rest.
 *   q_auto — pick the quality that is visually lossless for this image.
 *
 * Together they typically halve the bytes with no visible difference, which
 * matters here more than usual: the audience is mobile-first and may be paying
 * for the data.
 */

const CLOUDINARY_HOST = /(^|\.)cloudinary\.com$/;
const UPLOAD_SEGMENT = '/upload/';

/** Widths chosen for the layouts in use, not a generic ladder. */
export const DEFAULT_WIDTHS = [480, 768, 1024, 1440, 1920] as const;

export function isCloudinaryUrl(value: string): boolean {
  try {
    return CLOUDINARY_HOST.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

interface TransformOptions {
  /** Target width in pixels. Omitted means the original width. */
  width?: number;
  height?: number;
  /** `fill` crops to the box; `limit` never enlarges. Defaults to `limit`. */
  crop?: 'fill' | 'limit' | 'fit' | 'thumb';
  /** Where to keep the subject when cropping. `auto` lets Cloudinary decide. */
  gravity?: 'auto' | 'face' | 'center';
  /** Overrides q_auto — only for cases where automatic quality misjudges. */
  quality?: string;
}

function transformation(options: TransformOptions): string {
  const parts = ['f_auto', `q_${options.quality ?? 'auto'}`];

  if (options.width) parts.push(`w_${Math.round(options.width)}`);
  if (options.height) parts.push(`h_${Math.round(options.height)}`);
  if (options.width || options.height) parts.push(`c_${options.crop ?? 'limit'}`);
  if (options.gravity) parts.push(`g_${options.gravity}`);

  // Device pixel ratio is left to the browser via srcset rather than dpr_auto:
  // dpr_auto depends on a client hint that Safari does not send, and a 2x
  // image served to a 1x screen is the exact waste this module exists to avoid.
  return parts.join(',');
}

/**
 * Returns the address with a transformation applied.
 *
 * A bare public id is accepted too, so a record can store `founder/portrait`
 * instead of a full URL once the library is fully on Cloudinary.
 */
export function cloudinaryUrl(
  source: string,
  options: TransformOptions & { resourceType?: 'image' | 'video' } = {}
): string {
  if (!source) return source;

  const transform = transformation(options);

  if (isCloudinaryUrl(source)) {
    const index = source.indexOf(UPLOAD_SEGMENT);
    // Chaining onto an address that already carries a transformation is valid
    // and is what happens when a VA pastes a link copied from the Cloudinary
    // dashboard, so no attempt is made to strip what is already there.
    if (index === -1) return source;
    return `${source.slice(0, index + UPLOAD_SEGMENT.length)}${transform}/${source.slice(index + UPLOAD_SEGMENT.length)}`;
  }

  // Not a URL at all — treat it as a public id, if a cloud is configured.
  if (!env.cloudinaryCloudName || source.startsWith('http') || source.startsWith('/')) {
    return source;
  }

  const resource = options.resourceType ?? 'image';
  return `https://res.cloudinary.com/${env.cloudinaryCloudName}/${resource}/upload/${transform}/${source}`;
}

/**
 * Builds a srcset so the browser downloads the size it actually needs.
 *
 * Returns an empty string for non-Cloudinary assets, which React drops from the
 * DOM — the plain `src` still works, so an external asset simply loses the
 * responsive behaviour rather than breaking.
 */
export function cloudinarySrcSet(
  source: string,
  widths: readonly number[] = DEFAULT_WIDTHS,
  options: TransformOptions = {}
): string {
  if (!source || (!isCloudinaryUrl(source) && !env.cloudinaryCloudName)) return '';
  if (!isCloudinaryUrl(source) && (source.startsWith('http') || source.startsWith('/'))) return '';

  return widths
    .map((width) => `${cloudinaryUrl(source, { ...options, width })} ${width}w`)
    .join(', ');
}

/**
 * A still frame from a video, for use as a poster.
 *
 * Cloudinary renders one on request by asking for the video as an image, so a
 * separate poster file never has to be produced, uploaded, or kept in sync with
 * the cut it belongs to.
 */
export function cloudinaryPoster(source: string, width = 1280): string {
  if (!isCloudinaryUrl(source)) return '';

  const withoutExtension = source.replace(/\.[a-z0-9]{1,5}(\?.*)?$/i, '');
  const index = withoutExtension.indexOf(UPLOAD_SEGMENT);
  if (index === -1) return '';

  const head = withoutExtension.slice(0, index + UPLOAD_SEGMENT.length);
  const tail = withoutExtension.slice(index + UPLOAD_SEGMENT.length);

  // so_auto asks Cloudinary to pick a representative frame rather than taking
  // whatever happens to be at zero seconds, which is often a black fade-in.
  return `${head}so_auto,f_auto,q_auto,w_${width},c_limit/${tail}.jpg`;
}
