import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPut } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES } from '@/router/routes';
import { AdminHeader, Alert, EmptyState } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { useAsyncData } from './lib/useAsyncData';

/**
 * Per-route search metadata.
 *
 * Overrides only. A route with no record here still serves a complete set of
 * tags — the API falls back to the site defaults and then to the brand
 * constants — so this screen is for the pages worth writing by hand, not a
 * table every route has to appear in.
 */

interface RouteSeoRecord {
  id: string;
  path: string;
  seo?: { title?: string; description?: string; noIndex?: boolean };
}

const FIELDS: Field[] = [
  {
    kind: 'text',
    name: 'path',
    label: 'Route',
    format: 'path',
    required: true,
    placeholder: '/collections',
    hint: 'Lowercase, starting with a slash. "/collections" and "/collections/" are the same page.',
  },
  {
    kind: 'group',
    name: 'seo',
    label: 'Metadata',
    fields: [
      { kind: 'text', name: 'title', label: 'Title', maxLength: 70 },
      { kind: 'textarea', name: 'description', label: 'Description', rows: 3, maxLength: 200 },
      { kind: 'tags', name: 'keywords', label: 'Keywords' },
      { kind: 'text', name: 'ogImageUrl', label: 'Share image', format: 'url' },
      { kind: 'text', name: 'ogImageAlt', label: 'Share image alt text' },
      { kind: 'text', name: 'canonicalUrl', label: 'Canonical address', format: 'url' },
      { kind: 'boolean', name: 'noIndex', label: 'Hide this route from search engines' },
    ],
  },
];

export function AdminSeoPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const mayEdit = hasPermission('settings:manage');

  const [editing, setEditing] = useState<RouteSeoRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const state = useAsyncData<RouteSeoRecord[]>(() => apiGet<RouteSeoRecord[]>('/site/seo/admin/all'), []);
  const records = state.data ?? [];

  const open = creating ? { path: '', seo: {} } : editing;

  return (
    <>
      <Seo title="Search metadata" description="Per-route titles, descriptions, and share images." noIndex />
      <AdminHeader
        eyebrow="Website"
        title="Search metadata"
        intro="Overrides for individual routes. Anything without a record here inherits the site defaults, so only add the pages worth writing by hand."
        backTo={ROUTES.adminH2C}
        backLabel="Movement content"
        actions={
          mayEdit && !open ? (
            <button
              type="button"
              className="adm-mini adm-mini--go"
              onClick={() => {
                setCreating(true);
                setEditing(null);
              }}
            >
              Add a route
            </button>
          ) : null
        }
      />

      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}
      {!mayEdit && <Alert title="Read only">Route metadata is restricted to Super Administrators.</Alert>}

      {open && (
        <div className="adm-repitem" style={{ marginBottom: 22 }}>
          <div className="adm-rephead">
            <span className="adm-repnum">{creating ? 'New route' : open.path}</span>
            <button
              type="button"
              className="adm-mini"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Close
            </button>
          </div>
          <RecordForm
            key={creating ? 'new' : open.path}
            fields={FIELDS}
            record={open}
            submitLabel="Save metadata"
            disabled={!mayEdit}
            onSubmit={async (payload) => {
              await apiPut('/site/seo', payload);
              notify('Metadata saved.');
              setCreating(false);
              setEditing(null);
              state.reload();
            }}
          />
        </div>
      )}

      {state.loading && <p className="body body--quiet">Loading…</p>}

      {!state.loading && records.length === 0 && !state.error && (
        <EmptyState>No route overrides. Every page is using the site defaults.</EmptyState>
      )}

      {records.length > 0 && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Title</th>
                <th className="adm-secondary">Description</th>
                <th className="adm-secondary">Indexed</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="adm-cell-strong">{record.path}</td>
                  <td>
                    <span className="adm-cell-clip">{record.seo?.title || '—'}</span>
                  </td>
                  <td className="adm-secondary">
                    <span className="adm-cell-clip">{record.seo?.description || '—'}</span>
                  </td>
                  <td className="adm-secondary">{record.seo?.noIndex ? 'No' : 'Yes'}</td>
                  <td>
                    <div className="adm-rowacts">
                      <button
                        type="button"
                        className="adm-mini"
                        onClick={() => {
                          setEditing(record);
                          setCreating(false);
                        }}
                      >
                        {mayEdit ? 'Edit' : 'View'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
