import { useEffect, useState } from 'react';

/** Pixels from the top of the document, or a value derived from the viewport. */
export type ScrollThreshold = number | ((viewportHeight: number) => number);

/**
 * Reports whether the window has scrolled past `threshold`. Expressing the
 * threshold as a function of viewport height lets callers say "one screen
 * down" without re-reading `innerHeight` themselves, and keeps the value
 * correct after a resize or an orientation change.
 *
 * Reads are coalesced into an animation frame: scroll fires far more often
 * than the browser paints, and this only drives a visual toggle.
 *
 * Define the threshold outside the component (module scope or `useCallback`).
 * An inline arrow would be a new value every render and would tear the
 * listener down and back up on each toggle.
 */
export function useScrolledPast(threshold: ScrollThreshold): boolean {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    let frame = 0;

    const evaluate = (): void => {
      frame = 0;
      const limit = typeof threshold === 'function' ? threshold(window.innerHeight) : threshold;
      setPassed(window.scrollY > limit);
    };

    const schedule = (): void => {
      if (frame) return;
      frame = window.requestAnimationFrame(evaluate);
    };

    evaluate();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [threshold]);

  return passed;
}
