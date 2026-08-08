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
  /** Once real imagery exists, pass src and the slot renders the photograph. */
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * Every image position on the site is an asset slot.
 *
 * Until real photography is delivered it renders a labelled placeholder naming
 * the required filename and aspect ratio, which doubles as the shot list. The
 * guide forbids generic stock imagery, so there is deliberately no fallback
 * picture — an empty slot is more useful than a wrong one.
 */
export function AssetSlot({
  ratio,
  tone = '',
  label,
  spec,
  src,
  alt,
  className,
}: AssetSlotProps) {
  const isThumb = label === 'IMG';

  if (src) {
    /**
     * Cloudinary assets are resized and re-encoded on delivery, and offered to
     * the browser at several widths so it can pick one. Anything hosted
     * elsewhere renders exactly as before — `srcSet` comes back empty and React
     * omits the attribute.
     *
     * `sizes` is deliberately coarse: slots are full-width on a phone and about
     * half the viewport on a desktop, and a rough hint that is right most of the
     * time beats a precise one that is wrong when a layout changes.
     */
    return (
      <div className={cn('slot', `r-${ratio}`, tone && `slot--${tone}`, className)}>
        <img
          src={cloudinaryUrl(src, { width: 1440 })}
          srcSet={cloudinarySrcSet(src) || undefined}
          sizes="(max-width: 900px) 100vw, 50vw"
          alt={alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

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
