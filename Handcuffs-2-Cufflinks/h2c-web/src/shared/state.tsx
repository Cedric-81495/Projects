import type { ReactNode } from 'react';
import type { AsyncStatus } from '@/types';
import { cn } from '@/lib/cn';

// ============================================================
// Presentational state primitives.
// Together with useAsync they guarantee every data surface
// renders a meaningful state instead of a blank or broken gap.
// ============================================================

/** A single shimmering placeholder block. */
export function Skeleton({
  className,
  ratio,
  style,
}: {
  className?: string;
  ratio?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn('sk', ratio && `sk--${ratio}`, className)}
      style={style}
      aria-hidden="true"
    />
  );
}

/** A grid of skeleton cards, matching the eventual card layout. */
export function LoadingGrid({
  count = 4,
  grid = 'grid4',
  ratio = '4x5',
}: {
  count?: number;
  grid?: 'grid4' | 'eps';
  ratio?: string;
}) {
  return (
    <div className={grid} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i}>
          <Skeleton ratio={ratio} />
          <div className="card-txt" style={{ gap: 10 }}>
            <Skeleton className="sk--line sk--60" />
            <Skeleton className="sk--line sk--40" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty state — shown when the backend returns nothing (yet). */
export function EmptyState({
  title = 'Nothing here yet',
  note,
  action,
}: {
  title?: string;
  note?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state" role="status">
      <span className="state-mark" aria-hidden="true">
        <i />
        <b />
        <i />
      </span>
      <h3 className="state-title">{title}</h3>
      {note && <p className="state-note">{note}</p>}
      {action && <div className="btn-row" style={{ justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}

/** Error state — shown when a loader throws; offers a retry. */
export function ErrorState({
  onRetry,
  note = 'We could not load this section. It is not you — try again in a moment.',
}: {
  onRetry?: () => void;
  note?: string;
}) {
  return (
    <div className="state state--err" role="alert">
      <span className="state-mark" aria-hidden="true">
        <i />
        <b />
        <i />
      </span>
      <h3 className="state-title">Something interrupted the signal</h3>
      <p className="state-note">{note}</p>
      {onRetry && (
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn--ghost btn--sm" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The gate. Given a status, it renders exactly one of:
 * loading skeleton · error state · empty state · your content.
 * Content is only rendered once data is present and non-empty.
 */
export function AsyncContent<T>({
  status,
  data,
  loading,
  empty,
  onRetry,
  children,
}: {
  status: AsyncStatus;
  data: T | null;
  loading?: ReactNode;
  empty?: ReactNode;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}) {
  if (status === 'loading' || status === 'idle') {
    return <>{loading ?? <LoadingGrid />}</>;
  }
  if (status === 'error') {
    return <ErrorState onRetry={onRetry} />;
  }
  if (status === 'empty' || data == null) {
    return <>{empty ?? <EmptyState />}</>;
  }
  return <>{children(data)}</>;
}
