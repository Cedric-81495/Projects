import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

/**
 * Horizontal carousel.
 *
 * Built on native scroll with snap points rather than a transform-driven
 * slider, and rather than a package. Three reasons, in the order they mattered:
 *
 *   1. The audience is mobile-first and may be on metered data. A carousel
 *      library is 15–30KB gzip for behaviour the browser already has.
 *   2. Native scroll keeps momentum, rubber-banding, trackpad gestures and the
 *      scroll semantics assistive technology expects — all of which a
 *      transform slider has to reimplement, usually badly.
 *   3. Before hydration, or with JavaScript off, the rail is a plain
 *      scrollable list. It degrades to working, not to broken.
 *
 * The arrows, the progress line and the edge fades are affordances layered on
 * top. They exist to say "there is more to the right", which is the one thing a
 * bare scroll rail cannot say on a desktop with no visible scrollbar.
 */

interface CarouselProps {
  children: React.ReactNode;
  /** Names the rail for assistive technology, e.g. "Podcast clips". */
  label: string;
  /**
   * Optional heading rendered to the left of the arrows. Passing it here rather
   * than placing it above the component keeps heading and controls on one
   * baseline at every width.
   */
  heading?: React.ReactNode;
  /** Extra classes on the track, for per-section slide sizing. */
  trackClassName?: string;
  className?: string;
}

/**
 * On a touch screen a thumb beats a button, so the arrows are not rendered.
 * Tested on pointer alone: a laptop with a touchscreen reports `hover: none`
 * in some browsers while still being driven by a trackpad, and hiding the
 * arrows there would remove a control the visitor can actually use.
 */
const COARSE_POINTER = '(pointer: coarse)';

/**
 * Matches a media query, defaulting to false during prerender.
 *
 * This component is imported by the prerender build, where `window` does not
 * exist — reading it during render crashes the whole build rather than one
 * page, so the check is deferred to an effect.
 */
function useMediaQuery(queryString: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(queryString);
    const update = () => setMatches(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [queryString]);

  return matches;
}

export function Carousel({ children, label, heading, trackClassName, className }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  /** Nothing to scroll means no arrows, no progress line, no fades. */
  const [overflows, setOverflows] = useState(false);
  /** Fraction of the rail currently visible, and how far along it sits. */
  const [thumb, setThumb] = useState({ size: 1, offset: 0 });

  const isTouch = useMediaQuery(COARSE_POINTER);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const max = track.scrollWidth - track.clientWidth;
    // A sub-pixel remainder is normal at fractional zoom and would otherwise
    // leave the "next" arrow enabled forever at the end of the rail.
    const room = max > 2;
    const left = track.scrollLeft;
    const ratio = room ? Math.min(1, Math.max(0, left / max)) : 0;
    const size = room ? Math.max(0.12, track.clientWidth / track.scrollWidth) : 1;

    setOverflows(room);
    setAtStart(left <= 2);
    setAtEnd(!room || left >= max - 2);
    setThumb({ size, offset: ratio * (1 - size) });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    measure();
    track.addEventListener('scroll', measure, { passive: true });

    // Slides can arrive after mount (a fetched clip list) and the viewport can
    // change under a rotated phone, so width is observed rather than assumed.
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    for (const child of Array.from(track.children)) observer.observe(child);

    return () => {
      track.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [measure, children]);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;

      // Just under a full width, so the card at the fold stays partly in view
      // and the eye keeps its place instead of landing in unrelated content.
      const step = track.clientWidth * 0.82;
      track.scrollBy({ left: step * direction, behavior: reducedMotion ? 'auto' : 'smooth' });
    },
    [reducedMotion]
  );

  const scrollToEdge = useCallback(
    (edge: 'start' | 'end') => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({
        left: edge === 'start' ? 0 : track.scrollWidth,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    },
    [reducedMotion]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Home and End are handled because arrowing through twelve clips is
      // tedious, and both keys already mean this in every other list widget.
      const handlers: Record<string, () => void> = {
        ArrowRight: () => scrollByPage(1),
        ArrowLeft: () => scrollByPage(-1),
        Home: () => scrollToEdge('start'),
        End: () => scrollToEdge('end'),
      };

      const handler = handlers[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    },
    [scrollByPage, scrollToEdge]
  );

  const showArrows = overflows && !isTouch;

  return (
    <div
      className={cn('carousel', className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      {(heading || showArrows) && (
        <div className="carousel-head">
          <div className="carousel-title">{heading}</div>
          {showArrows && (
            <div className="carousel-nav">
              <button
                type="button"
                className="carousel-btn carousel-btn--prev"
                onClick={() => scrollByPage(-1)}
                disabled={atStart}
                aria-label={`Previous ${label.toLowerCase()}`}
              >
                <Icon name="arrow" />
              </button>
              <button
                type="button"
                className="carousel-btn"
                onClick={() => scrollByPage(1)}
                disabled={atEnd}
                aria-label={`More ${label.toLowerCase()}`}
              >
                <Icon name="arrow" />
              </button>
            </div>
          )}
        </div>
      )}

      <div
        ref={trackRef}
        className={cn('carousel-track', trackClassName)}
        data-at-start={atStart ? 'true' : 'false'}
        data-at-end={atEnd ? 'true' : 'false'}
        /**
         * Focusable so the rail can be reached and scrolled from the keyboard.
         * Chrome and Firefox now do this for scroll containers automatically;
         * Safari does not, and an unreachable rail is an accessibility failure
         * rather than a rough edge.
         */
        tabIndex={0}
        role="group"
        aria-label={`${label}. Use the left and right arrow keys to move through the list.`}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>

      {overflows && (
        <div className="carousel-progress" aria-hidden="true">
          <span
            style={{
              width: `${thumb.size * 100}%`,
              transform: `translateX(${(thumb.offset / Math.max(thumb.size, 0.0001)) * 100}%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
