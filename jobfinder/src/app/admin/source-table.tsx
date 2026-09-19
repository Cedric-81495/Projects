'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';

export interface SourceSummary {
  id: string;
  name: string;
  enabled: boolean;
  accessMethod: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  everyMinutes: number;
}

/**
 * Actions authenticate with the signed session cookie set at sign-in. It is
 * HttpOnly, so this component never sees or handles the password.
 */
export function SourceTable({ sources }: { sources: SourceSummary[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function call(path: string, method: string, body?: unknown) {
    setBusy(path);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401) {
        setMessage('Your session expired. Reload the page and sign in again.');
        return;
      }
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok
        ? `${path}: ${JSON.stringify(json).slice(0, 300)}`
        : `${path} failed (${res.status}): ${json.error ?? 'unknown error'}`);
    } catch (error) {
      setMessage(`Request failed: ${(error as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-ink">Sources</h2>

      <div>
        <Button variant="outline" onClick={() => call('/api/admin/sources', 'GET')}
                disabled={busy !== null}>
          Refresh status
        </Button>
      </div>

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-paper-raised text-left text-xs text-ink-muted">
            <tr>
              {['Source', 'Status', 'Last run', 'Every', 'Last error', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-paper-raised">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="px-3 py-2">
                  <p className="font-medium text-ink">{source.name}</p>
                  <p className="text-xs text-ink-muted">{source.id} · {source.accessMethod}</p>
                </td>
                <td className="px-3 py-2">
                  <StatusPill enabled={source.enabled} status={source.lastStatus} />
                </td>
                <td className="px-3 py-2 text-ink-muted">{formatDateTime(source.lastRunAt)}</td>
                <td className="px-3 py-2 text-ink-muted">{source.everyMinutes} min</td>
                <td className="max-w-[240px] truncate px-3 py-2 text-ink-muted"
                    title={source.lastError ?? ''}>
                  {source.lastError ?? '—'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" disabled={busy !== null}
                            onClick={() => call(`/api/admin/sources/${source.id}/run`, 'POST')}>
                      Run now
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy !== null}
                            onClick={() => call('/api/admin/sources', 'PATCH',
                              { id: source.id, enabled: !source.enabled })}>
                      {source.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-ink-muted">
                No sources yet. Apply migration 0002 to seed them.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {message && (
        <pre className="overflow-x-auto rounded-card border border-line bg-paper-raised p-3 text-xs text-ink-muted">
          {message}
        </pre>
      )}
    </section>
  );
}

function StatusPill({ enabled, status }: { enabled: boolean; status: string | null }) {
  if (!enabled) return <span className="text-ink-muted">Disabled</span>;
  const tone = status === 'success' ? 'text-moss-deep'
    : status === 'partial' ? 'text-amber-700'
    : status === 'failed' ? 'text-red-700'
    : 'text-ink-muted';
  return <span className={tone}>{status ?? 'not run yet'}</span>;
}
