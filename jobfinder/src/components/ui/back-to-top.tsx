'use client';

import { useEffect, useState } from 'react';

/**
 * Appears once the page has scrolled far enough to make scrolling back
 * tedious. Honours prefers-reduced-motion by jumping instead of animating.
 */
export function BackToTop({ showAfter = 600 }: { showAfter?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [showAfter]);

  function toTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-30 inline-flex h-10 items-center gap-2 rounded-card
                 border border-line bg-paper-raised px-3 text-sm text-ink shadow-sm
                 hover:border-moss hover:text-moss-deep
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-moss"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      Top
    </button>
  );
}
