// client/src/pages/admin/DocumentsReview.tsx  (NEW FILE)

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface AdminDocument {
  id: string;
  userEmail: string;
  type: string;
  originalFilename: string;
  status: 'pending' | 'approved' | 'rejected';
  downloadUrl: string;
  createdAt: string;
}

export function DocumentsReview() {
  const [rows, setRows] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AdminDocument[]>('/api/documents/admin/all')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  async function review(id: string, status: 'approved' | 'rejected') {
    setActingId(id);
    const prev = rows;
    setRows((r) => r.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      await apiFetch(`/api/documents/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      setRows(prev);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Documents</h1>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No documents submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="border border-gray-800 rounded p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{row.userEmail}</div>
                <div className="text-gray-500 text-xs">
                  {row.type} — {row.originalFilename}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={row.downloadUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-400 underline">
                  View
                </a>
                {row.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => review(row.id, 'approved')}
                      disabled={actingId === row.id}
                      className="text-xs border border-emerald-800 text-emerald-400 rounded px-2 py-1 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => review(row.id, 'rejected')}
                      disabled={actingId === row.id}
                      className="text-xs border border-red-800 text-red-400 rounded px-2 py-1 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="text-xs uppercase text-gray-400">{row.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
