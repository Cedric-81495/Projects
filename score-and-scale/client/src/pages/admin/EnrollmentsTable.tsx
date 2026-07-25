import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { EnrollmentStatus } from '../../components/dashboard/StatusBadge';

interface AdminEnrollment {
  id: string;
  userEmail: string;
  programName: string;
  status: EnrollmentStatus;
}

const STATUS_OPTIONS: EnrollmentStatus[] = ['pending_payment', 'active', 'in_review', 'funded', 'cancelled'];

export function EnrollmentsTable() {
  const [rows, setRows] = useState<AdminEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminEnrollment[]>('/api/admin/enrollments')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: EnrollmentStatus) {
    // Optimistic update, rolled back if the PATCH fails.
    const prev = rows;
    setRows((r) => r.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      await apiFetch(`/api/enrollments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      setRows(prev);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Enrollments</h1>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No enrollments yet — connects once the backend is live.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="py-2 font-normal">User</th>
              <th className="py-2 font-normal">Program</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-900">
                <td className="py-3">{row.userEmail}</td>
                <td className="py-3">{row.programName}</td>
                <td className="py-3">
                  <select
                    value={row.status}
                    onChange={(e) => updateStatus(row.id, e.target.value as EnrollmentStatus)}
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-200"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
