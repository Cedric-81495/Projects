import { Link } from 'react-router-dom';
import { Eyebrow } from '@/components/ui/Eyebrow';

/**
 * The furniture every CMS screen shares: a heading with its actions, the
 * two notice shapes, an empty state, and a pager.
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
    <>
      {backTo && (
        <Link to={backTo} className="adm-back">
          ← {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="adm-head">
        <div>
          <Eyebrow reveal={false}>{eyebrow}</Eyebrow>
          <h1 className="h-sm" style={{ margin: 0 }}>
            {title}
          </h1>
          {intro && <p className="body body--quiet">{intro}</p>}
        </div>
        {actions && <div className="adm-head-actions">{actions}</div>}
      </div>
    </>
  );
}

export function Alert({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="adm-alert" role="alert">
      <b>{title}</b>
      {children}
    </div>
  );
}

export function Confirmation({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-ok" role="status">
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="adm-empty">{children}</div>;
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Live',
  draft: 'Draft',
  scheduled: 'Scheduled',
  archived: 'Archived',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  'needs-changes': 'Needs changes',
  subscribed: 'Subscribed',
  unsubscribed: 'Unsubscribed',
  bounced: 'Bounced',
};

export function StatusPill({ status }: { status: string }) {
  const known = status in STATUS_LABEL;
  return (
    <span className={`adm-pill adm-pill--${known ? status : 'draft'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

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
        {total} record{total === 1 ? '' : 's'} · page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="adm-mini"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <button
        type="button"
        className="adm-mini"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}
