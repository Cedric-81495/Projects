import { useEffect } from 'react';

/**
 * Adds `.is-in` to every `.rise` / `.draw` element as it scrolls into view.
 * One shared observer for the whole document rather than one per component,
 * and it re-runs on route change so newly mounted sections are picked up.
 *
 * Reduced motion is handled in CSS: `.rise` resets to its final state, so
 * bailing out here simply means nothing needs observing.
 */
export function useReveal(dependency?: unknown): void {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      document
        .querySelectorAll<HTMLElement>('.rise, .draw')
        .forEach((el) => el.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    const targets = document.querySelectorAll<HTMLElement>('.rise:not(.is-in), .draw:not(.is-in)');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [dependency]);
}
