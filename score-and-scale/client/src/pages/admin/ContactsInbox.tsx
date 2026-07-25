import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: string;
}

export function ContactsInbox() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Submission[]>('/api/admin/contacts')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Contact Inbox</h1>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No submissions yet — connects once the backend is live.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="border border-gray-800 rounded p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-medium">{r.name}</span>
                <span className="text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-gray-500 text-xs mb-2">{r.email}</div>
              <p className="text-gray-300 text-sm">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
