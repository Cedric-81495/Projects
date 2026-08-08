import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES, buildPath } from '@/router/routes';
import type { PublishStatus } from '@/types/common';
import { AdminHeader, Card, Note, Skeleton, StatusPill } from './components/Chrome';
import { Glyph } from './components/Glyph';
import { RecordForm } from './components/RecordForm';
import { GROUP_LABEL, findResource } from './lib/resources';
import type { ResourceDef } from './lib/resources';
import { messageFor, useAsyncData } from './lib/useAsyncData';

interface RecordShape {
  id: string;
  status?: PublishStatus;
  publishedAt?: string | null;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Create and edit, sharing one form.
 *
 * Publishing is not a field on the form. It is a separate, audited action on
 * the API with its own permission, and putting a status dropdown in the form
 * would let a save quietly change what the public sees.
 */
export function ResourceEditPage() {
  const { resource: key, id } = useParams();
  const resource = findResource(key);

  if (!resource) return <Navigate to={ROUTES.adminDashboard} replace />;
  return <Editor key={`${resource.key}:${id}`} resource={resource} id={id === 'new' ? null : (id ?? null)} />;
}

function Editor({ resource, id }: { resource: ResourceDef; id: string | null }) {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { hasPermission } = useAuth();

  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mayWrite = hasPermission(resource.writePermission);
  const mayPublish = hasPermission('content:publish');
  const mayDelete = hasPermission('content:delete');

  const state = useAsyncData<RecordShape | null>(
    () => (id ? apiGet<RecordShape>(`${resource.basePath}/admin/${id}`) : Promise.resolve(null)),
    [resource.basePath, id]
  );

  const listPath = buildPath(ROUTES.adminRecords, { resource: resource.key });
  const record = state.data;

  async function save(payload: Record<string, unknown>): Promise<void> {
    if (id) {
      await apiPatch(`${resource.basePath}/${id}`, payload);
      notify('Saved.');
      state.reload();
      return;
    }

    const createdRecord = await apiPost<RecordShape>(resource.basePath, payload);
    notify('Created as a draft. Publish it when it is ready.');
    navigate(buildPath(ROUTES.adminRecordEdit, { resource: resource.key, id: createdRecord.id }), {
      replace: true,
    });
  }

  async function act(run: () => Promise<unknown>, done: string, thenLeave = false): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await run();
      notify(done);
      if (thenLeave) navigate(listPath);
      else state.reload();
    } catch (caught) {
      setActionError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  const title = id
    ? String(record?.name ?? record?.title ?? record?.message ?? record?.heading ?? `Edit ${resource.singular}`)
    : `New ${resource.singular}`;

  return (
    <>
      <Seo title={title} description={resource.intro} noIndex />

      <AdminHeader
        eyebrow={GROUP_LABEL[resource.group]}
        title={title}
        backTo={listPath}
        backLabel={resource.label}
        actions={
          id && record ? (
            <>
              <StatusPill status={String(record.status ?? 'draft')} />
              {mayPublish && record.status !== 'published' && record.status !== 'archived' && (
                <button
                  type="button"
                  className="adm-btn adm-btn--sm adm-btn--primary"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => apiPost(`${resource.basePath}/${id}/publish`),
                      'Published. It is live for visitors now.'
                    )
                  }
                >
                  <Glyph name="eye" />
                  Publish
                </button>
              )}
              {mayPublish && record.status === 'published' && (
                <button
                  type="button"
                  className="adm-btn adm-btn--sm"
                  disabled={busy}
                  onClick={() => void act(() => apiPost(`${resource.basePath}/${id}/unpublish`), 'Back to draft.')}
                >
                  <Glyph name="eye-off" />
                  Unpublish
                </button>
              )}
              {mayDelete && record.status !== 'archived' && (
                <button
                  type="button"
                  className="adm-btn adm-btn--sm adm-btn--danger"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => apiDelete(`${resource.basePath}/${id}`),
                      'Archived. Hidden from the site, not destroyed.',
                      true
                    )
                  }
                >
                  <Glyph name="trash" />
                  Archive
                </button>
              )}
            </>
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
      {!mayWrite && <Note title="Read only">Your role can view these records but not change them.</Note>}

      <Card style={{ maxWidth: 940 }}>
        {state.loading && id ? (
          <div style={{ display: 'grid', gap: 18 }}>
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} style={{ display: 'grid', gap: 6 }}>
                <Skeleton height={11} width={110} />
                <Skeleton height={36} />
              </div>
            ))}
          </div>
        ) : (
          <RecordForm
            fields={resource.fields}
            record={record}
            submitLabel={id ? 'Save changes' : `Create ${resource.singular}`}
            disabled={!mayWrite}
            onSubmit={save}
          />
        )}
      </Card>
    </>
  );
}
