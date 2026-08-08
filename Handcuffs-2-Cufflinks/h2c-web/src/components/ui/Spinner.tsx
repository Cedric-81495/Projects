import { cn } from '@/lib/utils/cn';

/**
 * Loading indicators.
 *
 * Two shapes, used in different places on purpose:
 *
 *   `Spinner`     — a small brass ring, for buttons and inline waits.
 *   `SectionLoad` — a labelled block, for a whole section that has not arrived.
 *
 * Both announce themselves to assistive technology. A silent spinner tells a
 * screen-reader user nothing at all, and "nothing at all" is indistinguishable
 * from a page that has finished loading with no content.
 *
 * There is no full-page loading screen anywhere in this system, and that is
 * deliberate. Blanking the whole page behind a spinner makes a site feel slower
 * than it is; the shell, the navigation and the headings render immediately and
 * only the part that is genuinely waiting shows that it is waiting.
 */

interface SpinnerProps {
  /** Announced while it spins. Keep it specific: "Loading episodes". */
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Spinner({ label = 'Loading', size = 'md', className }: SpinnerProps) {
  return (
    <span className={cn('spin', size === 'sm' && 'spin--sm', className)} role="status">
      <span className="sr">{label}</span>
    </span>
  );
}

interface SectionLoadProps {
  /** Shown and announced, e.g. "Loading the latest episodes". */
  label: string;
  /** Rough height in rows, so the section does not collapse then jump. */
  rows?: number;
  className?: string;
}

export function SectionLoad({ label, rows = 3, className }: SectionLoadProps) {
  return (
    <div
      className={cn('secload', className)}
      role="status"
      aria-live="polite"
      style={{ minHeight: `${rows * 56}px` }}
    >
      <Spinner label="" />
      <p>{label}</p>
    </div>
  );
}
