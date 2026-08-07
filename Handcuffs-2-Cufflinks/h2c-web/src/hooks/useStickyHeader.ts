import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Reports whether the page has scrolled past the header, and keeps the
 * `--top-h` custom property in sync with the real height of the announcement
 * bar plus header. Anchor scrolling and the breadcrumb padding both depend on
 * that measurement being accurate.
 */
export function useStickyHeader(stackRef: RefObject<HTMLElement | null>): boolean {
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const measure = (): void => {
      const height = stackRef.current?.offsetHeight ?? 112;
      document.documentElement.style.setProperty('--top-h', `${height}px`);
    };

    const onScroll = (): void => setIsStuck(window.scrollY > 12);

    measure();
    onScroll();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
    };
  }, [stackRef]);

  return isStuck;
}
