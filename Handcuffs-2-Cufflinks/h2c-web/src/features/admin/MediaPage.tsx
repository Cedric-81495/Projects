import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import type { Paginated } from '@/types/common';
import { AdminHeader, Alert, Card, EmptyState, Pager } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { messageFor, useAsyncData } from './lib/useAsyncData';

/**
 * The digital asset library.
 *
 * Assets are registered by address rather than uploaded. That is a deliberate
 * limit and worth naming: the storage decision is outstanding, and choosing a
 * vendor inside a CMS screen is how a platform ends up married to one by
 * accident. Everything the guide asks the library to do — one place, organised
 * by brand, alt text written once, reused across records — works today against
 * assets that are already hosted, and the records do not change shape when the
 * upload path lands.
 */

interface Asset {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'document';
  url: string;
  originalName: string;
  alt: string;
  caption?: string;
  brand: 'h2c' | 'gwop' | 'kitchen';
  tags: string[];
  archivedAt: string | null;
  createdAt: string;
}

const BRAND_LABEL: Record<string, string> = {
  h2c: 'Handcuffs 2 Cufflinks',
  gwop: 'GWOP',
  kitchen: 'Kitchen Muzik',
};

const BRAND_OPTIONS = Object.entries(BRAND_LABEL).map(([value, label]) => ({ value, label }));

const REGISTER_FIELDS: Field[] = [
  {
    kind: 'text',
    name: 'url',
    label: 'Address',
    format: 'url',
    required: true,
    placeholder: 'https://',
    hint: 'Where the file already lives. The type is worked out from the file extension.',
  },
  {
    kind: 'select',
    name: 'kind',
    label: 'Type',
    half: true,
    hint: 'Only needed if the address has no file extension.',
    options: [
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
      { value: 'audio', label: 'Audio' },
      { value: 'document', label: 'Document' },
    ],
  },
  { kind: 'select', name: 'brand', label: 'Brand', half: true, options: BRAND_OPTIONS },
  {
    kind: 'text',
    name: 'alt',
    label: 'Alt text',
    hint: 'Describe what is in the frame. Required for images before they can be used.',
  },
  { kind: 'text', name: 'caption', label: 'Caption' },
  { kind: 'text', name: 'originalName', label: 'Name', half: true, hint: 'Defaults to the filename.' },
  { kind: 'tags', name: 'tags', label: 'Tags' },
];

const EDIT_FIELDS: Field[] = [
  { kind: 'text', name: 'alt', label: 'Alt text' },
  { kind: 'text', name: 'caption', label: 'Caption' },
  { kind: 'select', name: 'brand', label: 'Brand', half: true, options: BRAND_OPTIONS },
  { kind: 'tags', name: 'tags', label: 'Tags' },
];

export function AdminMediaPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();

  const mayUpload = hasPermission('media:upload');
  const mayDelete = hasPermission('media:delete');

  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [kind, setKind] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const state = useAsyncData<Paginated<Asset>>(
    () =>
      apiGet<Paginated<Asset>>('/media', {
        page,
        pageSize: 48,
        search: search || undefined,
        brand: brand || undefined,
        kind: kind || undefined,
        includeArchived: includeArchived ? 'true' : 'false',
      }),
    [page, search, brand, kind, includeArchived]
  );

  const assets = state.data?.items ?? [];
  const editing = assets.find((asset) => asset.id === editingId) ?? null;

  async function run(work: () => Promise<unknown>, done: string): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await work();
      notify(done);
      state.reload();
    } catch (caught) {
      setActionError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo title="Media library" description="One library, organised by brand." noIndex />

      <AdminHeader
        eyebrow="Digital assets"
        title="Media library"
        intro="One library for all three brands. Alt text is written once here and travels with the asset wherever it is used."
        actions={
          mayUpload ? (
            <button type="button" className="adm-btn adm-btn--sm adm-btn--primary" onClick={() => setAdding(!adding)}>
              {adding ? 'Close' : 'Add an asset'}
            </button>
          ) : null
        }
      />

      <Alert title="Registration, not upload">
        Assets are catalogued by address while the storage backend is being decided. Point this at wherever
        the file already lives — the photographer’s delivery, a CDN, YouTube — and the record will not change
        shape when uploads land.
      </Alert>

      {adding && mayUpload && (
        <Card title="Add an asset">
          <RecordForm
            fields={REGISTER_FIELDS}
            record={{ brand: 'h2c' }}
            submitLabel="Add to the library"
            onSubmit={async (payload) => {
              await apiPost('/media', payload);
              notify('Added to the library.');
              setAdding(false);
              state.reload();
            }}
          />
        </Card>
      )}

      <Card flush>
      <div className="adm-toolbar">
        <input
          type="search"
          aria-label="Search the library"
          placeholder="Search by name, alt text, or caption"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter by brand"
          value={brand}
          onChange={(event) => {
            setBrand(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Every brand</option>
          {BRAND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Every type</option>
          <option value="image">Images</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="document">Documents</option>
        </select>
        <label className="adm-check" style={{ fontSize: '0.7rem' }}>
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(event) => {
              setIncludeArchived(event.target.checked);
              setPage(1);
            }}
          />
          <span>Show removed</span>
        </label>
        <span className="adm-count">{state.data ? `${state.data.total} assets` : ''}</span>
      </div>

      {actionError && <Alert title="That did not go through">{actionError}</Alert>}
      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}

      {editing && (
        <div className="adm-repitem" style={{ margin: 18 }}>
          <div className="adm-rephead">
            <span className="adm-repnum">{editing.originalName}</span>
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => setEditingId(null)}>
              Close
            </button>
          </div>
          <RecordForm
            key={editing.id}
            fields={EDIT_FIELDS}
            record={editing}
            submitLabel="Save asset"
            disabled={!mayUpload}
            onSubmit={async (payload) => {
              await apiPatch(`/media/${editing.id}`, payload);
              notify('Saved.');
              setEditingId(null);
              state.reload();
            }}
          />
        </div>
      )}

      {!state.loading && assets.length === 0 && !state.error && (
        <EmptyState
          title={search || brand || kind ? 'Nothing matches' : 'The library is empty'}
          glyph="image"
        >
          {search || brand || kind
            ? 'Try a different search, or clear the brand and type filters.'
            : 'Add the first asset by pointing at wherever the file already lives.'}
        </EmptyState>
      )}

      {assets.length > 0 && (
        <div className="adm-media" style={{ padding: 18 }}>
          {assets.map((asset) => (
            <div className="adm-mediaitem" key={asset.id}>
              <div className="adm-thumb">
                {asset.kind === 'image' ? (
                  <img src={asset.url} alt={asset.alt} loading="lazy" />
                ) : (
                  <span>{asset.kind}</span>
                )}
              </div>

              <span className="adm-medianame" title={asset.originalName}>
                {asset.originalName}
              </span>
              <span className="adm-meta">
                {BRAND_LABEL[asset.brand]}
                {asset.archivedAt ? ' · removed' : ''}
              </span>
              {!asset.alt && asset.kind === 'image' && (
                <span className="adm-err">No alt text.</span>
              )}

              <div className="adm-rowacts" style={{ justifyContent: 'flex-start' }}>
                <button type="button" className="adm-btn adm-btn--sm" onClick={() => setEditingId(asset.id)}>
                  {mayUpload ? 'Edit' : 'View'}
                </button>
                {mayDelete && !asset.archivedAt && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm adm-btn--danger"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => apiDelete(`/media/${asset.id}`),
                        'Removed from the library. Records already using it still work.'
                      )
                    }
                  >
                    Remove
                  </button>
                )}
                {mayDelete && asset.archivedAt && (
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm"
                    disabled={busy}
                    onClick={() => void run(() => apiPost(`/media/${asset.id}/restore`), 'Back in the library.')}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
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
