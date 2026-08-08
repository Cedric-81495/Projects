import crypto from 'node:crypto';
import { env } from '@/config/env';
import { ApiError } from '@/lib/ApiError';

/**
 * Cloudinary — signed direct upload, and nothing else.
 *
 * The bytes never pass through this API. The CMS asks for a signature, uploads
 * straight from the browser to Cloudinary, and then registers the resulting
 * address in the media library. That is deliberate:
 *
 *   - Render's request body limit is 1MB, and a docuseries master is not.
 *     Proxying uploads would mean raising it, buffering large files in a web
 *     process, and paying for the bandwidth twice.
 *   - The API secret stays on the server. The browser receives a signature that
 *     is valid for one upload, with the folder and resource type already fixed,
 *     so a leaked signature cannot be turned into an arbitrary upload.
 *   - No SDK. The signature is a SHA-1 of the sorted parameters plus the
 *     secret; that is the whole of Cloudinary's scheme, and a dependency for
 *     twelve lines is a dependency to keep patched for no reason.
 *
 * Signed uploads are used rather than unsigned presets because an unsigned
 * preset is a public write endpoint for anyone who reads the page source.
 */

/** Cloudinary files audio under `video` — same pipeline, same transformations. */
export type ResourceType = 'image' | 'video' | 'raw';

const RESOURCE_BY_KIND: Record<string, ResourceType> = {
  image: 'image',
  video: 'video',
  audio: 'video',
  document: 'raw',
};

export function resourceTypeFor(kind: string): ResourceType {
  return RESOURCE_BY_KIND[kind] ?? 'image';
}

/**
 * Signs a set of upload parameters.
 *
 * Cloudinary's rule: drop empty values, sort the remaining keys, join as a
 * query string, append the API secret, SHA-1 the result. `file`, `api_key`,
 * `resource_type` and `cloud_name` are excluded by the same rule — they travel
 * with the request but are not signed.
 */
export function signUploadParams(params: Record<string, string | number>): string {
  if (!env.cloudinaryEnabled) {
    throw ApiError.badRequest('Cloudinary is not configured on this environment.');
  }

  const signable = Object.entries(params)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${signable}${env.CLOUDINARY_API_SECRET}`)
    .digest('hex');
}

/**
 * Recognises an address served by *this* Cloudinary account.
 *
 * Scoped to the configured cloud name on purpose: an asset on somebody else's
 * cloud is an external reference we happen to be able to read, not an object
 * this platform owns and could delete.
 */
export function isOwnCloudinaryUrl(rawUrl: string): boolean {
  if (!env.CLOUDINARY_CLOUD_NAME) return false;

  try {
    const { hostname, pathname } = new URL(rawUrl);
    return (
      (hostname === 'res.cloudinary.com' || hostname.endsWith('.cloudinary.com')) &&
      pathname.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/`)
    );
  } catch {
    return false;
  }
}

/**
 * Extracts the public id from a delivery URL.
 *
 * The shape is /<cloud>/<resource>/<type>/[transformations/][v123/]<public id>.
 * Version and transformation segments are optional and both sit between the
 * delivery type and the id, so they are removed by pattern rather than by
 * counting segments — a URL with `f_auto,q_auto` in it is otherwise off by one.
 */
export function publicIdFromUrl(rawUrl: string): string | null {
  try {
    const segments = new URL(rawUrl).pathname.split('/').filter(Boolean);
    // [cloud, resourceType, deliveryType, ...rest]
    const rest = segments.slice(3);
    if (rest.length === 0) return null;

    const withoutVersion = rest.filter((segment) => !/^v\d+$/.test(segment));
    // A transformation segment is a comma-separated list of `x_y` pairs.
    const withoutTransforms = withoutVersion.filter(
      (segment, index) =>
        !(index === 0 && /^[a-z]{1,3}_[^/]+/.test(segment) && segment.includes('_'))
    );

    const path = withoutTransforms.join('/');
    return path.replace(/\.[a-z0-9]{1,5}$/i, '') || null;
  } catch {
    return null;
  }
}
