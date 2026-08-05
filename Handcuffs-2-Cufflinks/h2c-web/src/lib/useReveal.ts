import { useEffect } from 'react';

/**
 * Adds `.in` to every `.rise:not(.in)` element as it scrolls into view.
 * Re-runs when `dep` changes (e.g. route change) so new content animates.
 */
export function useReveal(dep?: unknown): void {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.rise:not(.in)'));
    if (reduce) {
      nodes.forEach((n) => n.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [dep]);
}
