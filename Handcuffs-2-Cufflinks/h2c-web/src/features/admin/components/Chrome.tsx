import { Link } from 'react-router-dom';
import { Glyph } from './Glyph';
import type { GlyphName } from './Glyph';

/**
 * The furniture every CMS screen shares.
 *
 * Small pieces, kept together, because their value is that they look identical
 * everywhere — an operator should never have to work out whether this screen's
 * "saved" message means the same as the last one's.
 */

export function AdminHeader({
  eyebrow,
  title,
  intro,
  backTo,
  backLabel,
  actions,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {backTo && (
        <Link to={backTo} className="adm-back">
          <Glyph name="chevron-left" />
          {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="adm-head">
        <div className="adm-head-title">
          <span className="adm-eyebrow">{eyebrow}</span>
          <h1 className="adm-h1">{title}</h1>
          {intro && <p className="adm-sub">{intro}</p>}
        </div>
        {actions && <div className="adm-head-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  description,
  actions,
  flush,
  children,
  style,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  /** No body padding — for tables, which bring their own. */
  flush?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section className="adm-card" style={style}>
      {(title || actions) && (
        <div className="adm-card-hd">
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="adm-head-actions">{actions}</div>}
        </div>
      )}
      <div className={flush ? 'adm-card-bd adm-card-bd--flush' : 'adm-card-bd'}>{children}</div>
    </section>
  );
}

type NoteTone = 'info' | 'bad' | 'good';

const NOTE_GLYPH: Record<NoteTone, GlyphName> = { info: 'info', bad: 'alert', good: 'check' };

export function Note({
  title,
  tone = 'info',
  children,
}: {
  title?: string;
  tone?: NoteTone;
  children: React.ReactNode;
}) {
  return (
    <div className={`adm-note adm-note--${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <Glyph name={NOTE_GLYPH[tone]} />
      <div>
        {title && <b>{title}</b>}
        {children}
      </div>
    </div>
  );
}

/** Kept for call sites that read better as "Alert". */
export function Alert({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Note title={title} tone="bad">
      {children}
    </Note>
  );
}

export function Confirmation({ children }: { children: React.ReactNode }) {
  return <Note tone="good">{children}</Note>;
}

export function EmptyState({
  title,
  glyph = 'inbox',
  children,
  action,
}: {
  title?: string;
  glyph?: GlyphName;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="adm-empty">
      <Glyph name={glyph} />
      {title && <b>{title}</b>}
      <span style={{ maxWidth: '46ch' }}>{children}</span>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

type PillTone = 'good' | 'warn' | 'bad' | 'mute' | 'accent';

const STATUS: Record<string, { label: string; tone: PillTone }> = {
  published: { label: 'Live', tone: 'good' },
  draft: { label: 'Draft', tone: 'mute' },
  scheduled: { label: 'Scheduled', tone: 'accent' },
  archived: { label: 'Archived', tone: 'mute' },
  pending: { label: 'Pending', tone: 'warn' },
  approved: { label: 'Approved', tone: 'good' },
  rejected: { label: 'Rejected', tone: 'bad' },
  'needs-changes': { label: 'Needs changes', tone: 'warn' },
  subscribed: { label: 'Subscribed', tone: 'good' },
  unsubscribed: { label: 'Unsubscribed', tone: 'mute' },
  bounced: { label: 'Bounced', tone: 'bad' },
  active: { label: 'Active', tone: 'good' },
  inactive: { label: 'Inactive', tone: 'mute' },
};

export function StatusPill({ status }: { status: string }) {
  const known = STATUS[status];
  return <span className={`adm-pill adm-pill--${known?.tone ?? 'mute'}`}>{known?.label ?? status}</span>;
}

/* ------------------------------------------------------------------ */
/* Paging                                                              */
/* ------------------------------------------------------------------ */

export function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="adm-pager">
      <span>
        {total.toLocaleString()} record{total === 1 ? '' : 's'} · page {page} of {totalPages}
      </span>
      <span style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="adm-btn adm-btn--sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          <Glyph name="chevron-left" />
          Previous
        </button>
        <button
          type="button"
          className="adm-btn adm-btn--sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <Glyph name="chevron-right" />
        </button>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return <div className="adm-skel" style={{ height, width }} />;
}

/** Placeholder rows shaped like the table that is loading, so nothing jumps. */
export function SkeletonRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ display: 'grid', gap: 1, padding: 18 }}>
      {Array.from({ length: rows }, (_unused, row) => (
        <div key={row} style={{ display: 'flex', gap: 16, padding: '10px 0' }}>
          {Array.from({ length: columns }, (_ignored, column) => (
            <Skeleton key={column} width={column === 0 ? '28%' : '16%'} height={13} />
          ))}
        </div>
      ))}
    </div>
  );
}
