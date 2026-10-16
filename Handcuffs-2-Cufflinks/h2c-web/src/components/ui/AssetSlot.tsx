import { useState } from 'react';
import { cloudinarySrcSet, cloudinaryUrl } from '@/lib/media/cloudinary';
import { cn } from '@/lib/utils/cn';

export type Ratio = '2x3' | '3x4' | '1x1' | '4x5' | '4x3' | '16x9' | '21x9';
export type Tone = '' | 'warm' | 'em';

interface AssetSlotProps {
  ratio: Ratio;
  tone?: Tone;
  /** Short label, e.g. "PHOTO" or "VIDEO". */
  label: string;
  /** The exact filename and dimensions the photographer must deliver. */
  spec?: string;
  /** An explicit address. Wins over anything derived from `spec`. */
  src?: string;
  alt?: string;
  className?: string;
  /**
   * What to show when there is no image, or the one named cannot be loaded.
   *
   * `'placeholder'` is the default and names the file still needed, which is
   * how the shot list stays visible on the page. `'none'` renders nothing,
   * for a slot that is an enhancement rather than a gap — a hover layer that
   * falls back to a grey placeholder would reveal a placeholder *over* a
   * photograph, which is worse than not reacting at all.
   */
  fallback?: 'placeholder' | 'none';
}

/** A filename and nothing else: no spaces, no slashes, a known image extension. */
const IMAGE_FILENAME = /^[\w.-]+\.(jpe?g|png|webp|avif|gif)$/i;

/**
 * Works out what to render from the two props that can carry an image.
 *
 * Three sources, in order of authority:
 *
 *   1. `src` — passed deliberately by the caller.
 *   2. `spec` that is already an address — the adapters overload this field,
 *      returning a live `images[0].url` when a record has one and a placeholder
 *      label when it does not. Treating an address as a label is how a real
 *      photograph ends up rendered as grey text.
 *   3. `spec` that is a bare filename — served from `public/media`, which is
 *      how interim photography reaches the site before the library is filled.
 *
 * Anything else ("9:16 vertical cut", "Founder — hero image") is prose and
 * stays a placeholder, which is the point: an unfinished record reads as a
 * shot list rather than a broken picture.
 */
function resolveSource(src?: string, spec?: string): string | undefined {
  if (src) return src;
  if (!spec) return undefined;
  if (/^https?:\/\//i.test(spec) || spec.startsWith('/')) return spec;
  if (IMAGE_FILENAME.test(spec)) return `/media/${spec}`;
  return undefined;
}

/**
 * Every image position on the site is an asset slot.
 *
 * Until real photography is delivered it renders a labelled placeholder naming
 * the required filename and aspect ratio, which doubles as the shot list. The
 * guide forbids generic stock imagery, so there is deliberately no fallback
 * picture — an empty slot is more useful than a wrong one.
 *
 * Precedence, lowest effort first: a file committed to `public/media` under the
 * spec's own name shows immediately; a Cloudinary address from the media
 * library replaces it with no code change, because the same element renders
 * both and `cloudinaryUrl` leaves a local path untouched.
 */
export function AssetSlot({
  ratio,
  tone = '',
  label,
  spec,
  src,
  alt,
  className,
  fallback = 'placeholder',
}: AssetSlotProps) {
  /**
   * The address that failed to load, if one did.
   *
   * Held as the address rather than a boolean so it clears itself when the
   * address changes: a record that gains a real image after a local file was
   * missing is retried, not written off for the life of the component.
   */
  const [failed, setFailed] = useState<string | null>(null);

  const isThumb = label === 'IMG';
  const resolved = resolveSource(src, spec);
  const showImage = Boolean(resolved) && failed !== resolved;

  if (resolved && showImage) {
    /**
     * Cloudinary assets are resized and re-encoded on delivery, and offered to
     * the browser at several widths so it can pick one. Anything hosted
     * elsewhere — including a file in `public/media` — renders exactly as
     * before: `srcSet` comes back empty and React omits the attribute.
     *
     * `sizes` is deliberately coarse: slots are full-width on a phone and about
     * half the viewport on a desktop, and a rough hint that is right most of the
     * time beats a precise one that is wrong when a layout changes.
     */
    return (
      <div className={cn('slot', `r-${ratio}`, tone && `slot--${tone}`, className)}>
        <img
          src={cloudinaryUrl(resolved, { width: 1440 })}
          srcSet={cloudinarySrcSet(resolved) || undefined}
          sizes="(max-width: 900px) 100vw, 50vw"
          alt={alt ?? ''}
          loading="lazy"
          decoding="async"
          /**
           * A spec naming a file nobody has delivered yet is the normal state of
           * this project, not an error. Falling back to the placeholder keeps
           * the shot list visible instead of showing a broken-image icon.
           */
          onError={() => setFailed(resolved)}
        />
      </div>
    );
  }

  if (fallback === 'none') return null;

  return (
    <div
      className={cn(
        'slot',
        `r-${ratio}`,
        tone && `slot--${tone}`,
        isThumb && 'slot--thumb',
        className
      )}
      role="img"
      aria-label={spec ? `Image placeholder: ${spec}` : 'Image placeholder'}
    >
      <div className="slot-txt">
        <b>{label}</b>
        {spec && <span>{spec}</span>}
      </div>
    </div>
  );
}
