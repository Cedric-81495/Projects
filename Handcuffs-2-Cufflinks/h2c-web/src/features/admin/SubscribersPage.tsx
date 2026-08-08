import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiDownload, apiGet } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import type { Paginated } from '@/types/common';
import { AdminHeader, Alert, Card, EmptyState, Pager, SkeletonRows, StatusPill } from './components/Chrome';
import { Glyph } from './components/Glyph';
import { messageFor, useAsyncData } from './lib/useAsyncData';

/**
 * Join the Movement subscribers — the North Star metric.
 *
 * Export is a link rather than a fetch because the API returns a CSV file with
 * its own content-disposition, and the browser already knows how to save one.
 * It carries its own permission and is audited: a paginated view is routine,
 * walking off with the whole audience list is not.
 */

interface Subscriber {
  id: string;
  firstName: string;
  email: string;
  mobile?: string;
  interests?: string[];
  status: string;
  consentEmail: boolean;
  consentSms: boolean;
  consentAt?: string;
  createdAt: string;
}

export function AdminSubscribersPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const [status, setStatus] = useState('subscribed');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const mayRead = hasPermission('subscribers:read');
  const mayExport = hasPermission('subscribers:export');

  const state = useAsyncData<Paginated<Subscriber>>(
    () =>
      mayRead
        ? apiGet<Paginated<Subscriber>>('/subscribers', {
            page,
            pageSize: 50,
            status: status || undefined,
          })
        : Promise.resolve({ items: [], page: 1, pageSize: 50, total: 0, totalPages: 1 }),
    [page, status, mayRead]
  );

  const rows = state.data?.items ?? [];

  return (
    <>
      <Seo title="Subscribers" description="Join the Movement subscribers." noIndex />

      <AdminHeader
        eyebrow="Audience"
        title="Join the Movement"
        intro="Growth here is how this platform's success is measured — not apparel sales. Consent is recorded per channel with the date it was given."
        actions={
          mayExport ? (
            <button
              type="button"
              className="adm-btn adm-btn--sm adm-btn--primary"
              disabled={exporting}
              onClick={() => {
                setExporting(true);
                setExportError(null);
                void apiDownload('/subscribers/export', 'h2c-subscribers.csv')
                  .then(() => notify('Export downloaded. It is recorded in the audit log.'))
                  .catch((caught: unknown) => setExportError(messageFor(caught)))
                  .finally(() => setExporting(false));
              }}
            >
              <Glyph name="download" />
              {exporting ? 'Preparing' : 'Export CSV'}
            </button>
          ) : null
        }
      />

      {exportError && <Alert title="Export failed">{exportError}</Alert>}
      {!mayRead && <Alert title="No access">Your role cannot view the subscriber list.</Alert>}

      {mayRead && (
        <Card flush>
          <div className="adm-toolbar">
            <select
              className="adm-inp"
              style={{ width: 'auto', minWidth: 160 }}
              aria-label="Filter by status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Everyone</option>
              <option value="subscribed">Subscribed</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
            </select>
            <span className="adm-count">{state.data ? `${state.data.total} people` : ''}</span>
          </div>

          {state.error && (
            <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>
          )}

          {!state.loading && rows.length === 0 && !state.error && (
            <EmptyState title="Nobody yet" glyph="mail">
              The Join the Movement form on the public site feeds this list.
            </EmptyState>
          )}
          {state.loading && rows.length === 0 && <SkeletonRows columns={5} />}

          {rows.length > 0 && (
            <div className="adm-tablewrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th className="adm-secondary">Mobile</th>
                    <th className="adm-secondary">Interests</th>
                    <th className="adm-secondary">Consent</th>
                    <th className="adm-secondary">Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="adm-strong">{row.firstName}</td>
                      <td>{row.email}</td>
                      <td className="adm-secondary">{row.mobile || '—'}</td>
                      <td className="adm-secondary">
                        <span className="adm-clip">{(row.interests ?? []).join(', ') || '—'}</span>
                      </td>
                      <td className="adm-secondary">
                        {[row.consentEmail && 'email', row.consentSms && 'SMS'].filter(Boolean).join(' + ') ||
                          'none'}
                      </td>
                      <td className="adm-secondary">{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td>
                        <StatusPill status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {state.data && (
            <Pager
              page={state.data.page}
              totalPages={state.data.totalPages}
              total={state.data.total}
              onChange={setPage}
            />
          )}
        </Card>
      )}

      <p className="adm-hint" style={{ margin: 0, maxWidth: '62ch' }}>
        Newsletter campaigns are not built yet — the API has no campaign endpoints. Until they exist, export
        the list and send from the email provider.
      </p>
    </>
  );
}
