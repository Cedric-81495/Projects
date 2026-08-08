import { useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useScrolledPast } from '@/hooks/useScrolledPast';
import { cn } from '@/lib/utils/cn';

/**
 * Roughly one screen down. The homepage runs thirteen sections and the
 * Collections grid is longer still, so by this point the fixed header's
 * wordmark is the only way back and a reader deep in a docuseries story has
 * no quick route to the Join the Movement CTA in the footer chrome.
 */
const ONE_SCREEN = (viewportHeight: number): number => viewportHeight * 0.9;

/**
 * Floating return-to-top control for the public shell.
 *
 * Visibility is driven by `visibility` rather than a mounted/unmounted node so
 * the button is removed from the tab order and the accessibility tree while
 * hidden without any `aria-hidden` juggling — the same pattern the drawer and
 * mobile nav already use.
 */
export function BackToTop() {
  const visible = useScrolledPast(ONE_SCREEN);

  const scrollToTop = useCallback((): void => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });

    // The button is about to hide itself, which would strand keyboard and
    // screen-reader users on a dead control. Hand focus back to the top of the
    // document instead — same target the skip link uses.
    document.getElementById('main')?.focus({ preventScroll: true });
  }, []);

  return (
    <button
      type="button"
      className={cn('totop', visible && 'is-on')}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <Icon name="arrow" />
    </button>
  );
}
