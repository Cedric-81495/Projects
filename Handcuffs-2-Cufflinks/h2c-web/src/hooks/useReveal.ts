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

    const observeAll = (): void => {
      document
        .querySelectorAll<HTMLElement>('.rise:not(.is-in), .draw:not(.is-in)')
        .forEach((el) => observer.observe(el));
    };

    observeAll();

    /**
     * Re-observe whatever appears later.
     *
     * Most content arrives with the page: seed data renders immediately and the
     * API quietly replaces the text inside elements that already exist, so they
     * keep the class they were given. But where live data changes the *shape* of
     * a section — two written paragraphs becoming three from the CMS — React
     * unmounts the originals and mounts new ones, and those were never passed to
     * the observer. They stay at opacity 0 and the section reads as empty.
     *
     * Cheap to run: the callback only queries for elements that are not already
     * revealed, and the observer ignores anything it is already watching.
     */
    const mutations = new MutationObserver(observeAll);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [dependency]);
}
