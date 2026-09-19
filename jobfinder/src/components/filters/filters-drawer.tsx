'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { countActiveFilters } from '@/lib/filters';

/**
 * One filter panel, positioned two ways.
 *
 * On desktop it is an ordinary grid item. On mobile it becomes an off-canvas
 * drawer opened by a floating button, so the filters are reachable from the
 * bottom of a long results list without scrolling back to the top.
 *
 * The children render once either way — this repositions a single node rather
 * than duplicating the controls, so there is no chance of the two copies
 * disagreeing.
 */
export function FiltersDrawer({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  const activeCount = countActiveFilters(new URLSearchParams(params.toString()));

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Escape closes; the page behind must not scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      {/* Trigger — mobile only, and out of the way of Back to top. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="job-filters-panel"
        className="fixed bottom-6 left-6 z-40 inline-flex h-11 items-center gap-2 rounded-card
                   border border-moss bg-moss px-4 text-sm font-medium text-white shadow-lg
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-moss lg:hidden"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 6h18M7 12h10M11 18h2" />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="rounded-full bg-white/25 px-1.5 text-xs">{activeCount}</span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <div
        id="job-filters-panel"
        ref={panelRef}
        tabIndex={-1}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Job filters"
        className={cn(
          // Mobile: off-canvas drawer.
          'fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto bg-paper p-4',
          'transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: an ordinary grid item again.
          'lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0',
          'lg:overflow-visible lg:bg-transparent lg:p-0',
        )}
      >
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <p className="text-base font-semibold text-ink">Filters</p>
          <button
            type="button"
            onClick={close}
            className="rounded-card border border-line px-3 py-1.5 text-sm text-ink-muted
                       hover:border-moss hover:text-moss-deep"
          >
            Done
          </button>
        </div>

        {children}
      </div>
    </>
  );
}
