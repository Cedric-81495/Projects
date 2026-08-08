import { useCallback, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { apiDelete, apiGet, apiPost } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES, buildPath } from '@/router/routes';
import type { Paginated, PublishStatus } from '@/types/common';
import { AdminHeader, Card, EmptyState, Note, Pager, SkeletonRows, StatusPill } from './components/Chrome';
import { Glyph } from './components/Glyph';
import { valueAt } from './lib/fields';
import { GROUP_LABEL, MODULE_ROUTE, findResource } from './lib/resources';
import type { Column, ResourceDef } from './lib/resources';
import { messageFor, useAsyncData } from './lib/useAsyncData';

interface Row {
  id: string;
  status?: PublishStatus;
  [key: string]: unknown;
}

/**
 * The list screen, shared by every record type.
 *
 * Drafts are included — this is the working view, not the public one — and the
 * status filter defaults to everything, so a VA returning to a half-finished
 * record finds it without knowing to look for it.
 */
export function ResourceListPage() {
  const { resource: key } = useParams();
  const resource = findResource(key);

  if (!resource) return <Navigate to={ROUTES.adminDashboard} replace />;
  return <List key={resource.key} resource={resource} />;
}

function List({ resource }: { resource: ResourceDef }) {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const [params] = useSearchParams();

  // Seeded from the topbar search, so a query typed up there lands here.
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const mayWrite = hasPermission(resource.writePermission);
  const mayPublish = hasPermission('content:publish');
  const mayDelete = hasPermission('content:delete');

  const state = useAsyncData<Paginated<Row>>(
    () =>
      apiGet<Paginated<Row>>(`${resource.basePath}/admin/all`, {
        page,
        pageSize: 25,
        search: search || undefined,
        status: status || undefined,
      }),
    [resource.basePath, page, search, status]
  );

  const { reload } = state;

  const act = useCallback(
    async (id: string, run: () => Promise<unknown>, done: string) => {
      setBusyId(id);
      setActionError(null);
      try {
        await run();
        notify(done);
        reload();
      } catch (caught) {
        setActionError(messageFor(caught));
      } finally {
        setBusyId(null);
      }
    },
    [notify, reload]
  );

  const rows = state.data?.items ?? [];
  const filtered = Boolean(search || status);

  return (
    <>
      <Seo title={resource.label} description={resource.intro} noIndex />

      <AdminHeader
        eyebrow={GROUP_LABEL[resource.group]}
        title={resource.label}
        intro={resource.intro}
        backTo={MODULE_ROUTE[resource.group]}
        backLabel={GROUP_LABEL[resource.group]}
        actions={
          mayWrite ? (
            <Link
              className="adm-btn adm-btn--primary"
              to={buildPath(ROUTES.adminRecordNew, { resource: resource.key })}
            >
              <Glyph name="plus" />
              New {resource.singular}
            </Link>
          ) : null
        }
      />

      {actionError && (
        <Note title="That did not go through" tone="bad">
          {actionError}
        </Note>
      )}
      {state.error && (
        <Note title={state.offline ? 'API unreachable' : 'Could not load'} tone="bad">
          {state.error}
        </Note>
      )}

      <Card flush>
        <div className="adm-toolbar">
          <div className="adm-search">
            <Glyph name="search" />
            <input
              type="search"
              aria-label={`Search ${resource.label.toLowerCase()}`}
              placeholder={`Search ${resource.label.toLowerCase()}`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="adm-inp"
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Every status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Live</option>
            <option value="archived">Archived</option>
          </select>

          <span className="adm-count">
            {state.data ? `${state.data.total.toLocaleString()} total` : state.loading ? 'Loading' : ''}
          </span>
        </div>

        {state.loading && rows.length === 0 ? (
          <SkeletonRows columns={resource.columns.length} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nothing matches' : `No ${resource.label.toLowerCase()} yet`}
            action={
              !filtered && mayWrite ? (
                <Link
                  className="adm-btn adm-btn--primary adm-btn--sm"
                  to={buildPath(ROUTES.adminRecordNew, { resource: resource.key })}
                >
                  <Glyph name="plus" />
                  Create the first {resource.singular}
                </Link>
              ) : undefined
            }
          >
            {filtered
              ? 'Try a different search or clear the status filter.'
              : resource.blurb}
          </EmptyState>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  {resource.columns.map((column) => (
                    <th key={column.key} className={column.secondary ? 'adm-secondary' : undefined}>
                      {column.label}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {resource.columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={[column.secondary ? 'adm-secondary' : '', column.kind === 'number' ? 'adm-num' : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <Cell row={row} column={column} emphasise={index === 0} />
                      </td>
                    ))}
                    <td>
                      <div className="adm-rowacts">
                        <Link
                          className="adm-btn adm-btn--sm"
                          to={buildPath(ROUTES.adminRecordEdit, { resource: resource.key, id: row.id })}
                        >
                          <Glyph name={mayWrite ? 'pencil' : 'eye'} />
                          {mayWrite ? 'Edit' : 'View'}
                        </Link>

                        {mayPublish && row.status !== 'published' && row.status !== 'archived' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn--sm adm-btn--primary"
                            disabled={busyId === row.id}
                            onClick={() =>
                              void act(
                                row.id,
                                () => apiPost(`${resource.basePath}/${row.id}/publish`),
                                'Published. It is live for visitors now.'
                              )
                            }
                          >
                            Publish
                          </button>
                        )}

                        {mayPublish && row.status === 'published' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn--sm"
                            disabled={busyId === row.id}
                            onClick={() =>
                              void act(
                                row.id,
                                () => apiPost(`${resource.basePath}/${row.id}/unpublish`),
                                'Back to draft. It is no longer on the site.'
                              )
                            }
                          >
                            Unpublish
                          </button>
                        )}

                        {mayDelete && row.status !== 'archived' && (
                          <button
                            type="button"
                            className="adm-btn adm-btn--sm adm-btn--danger"
                            disabled={busyId === row.id}
                            aria-label={`Archive this ${resource.singular}`}
                            onClick={() =>
                              void act(
                                row.id,
                                () => apiDelete(`${resource.basePath}/${row.id}`),
                                'Archived. Hidden from the site, not destroyed.'
                              )
                            }
                          >
                            <Glyph name="trash" />
                          </button>
                        )}
                      </div>
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
    </>
  );
}

function Cell({ row, column, emphasise }: { row: Row; column: Column; emphasise: boolean }) {
  const raw = valueAt(row, column.key);

  if (column.kind === 'status') return <StatusPill status={String(raw ?? 'draft')} />;
  if (column.kind === 'boolean') return raw ? <StatusPill status="active" /> : <span>—</span>;

  if (column.kind === 'date') {
    if (!raw) return <span>—</span>;
    const date = new Date(String(raw));
    return (
      <span>
        {Number.isNaN(date.getTime())
          ? '—'
          : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    );
  }

  if (column.kind === 'number') return <span>{Number(raw ?? 0).toLocaleString()}</span>;

  const text = raw === null || raw === undefined || raw === '' ? '—' : String(raw);
  return <span className={emphasise ? 'adm-strong adm-clip' : 'adm-clip'}>{text}</span>;
}
