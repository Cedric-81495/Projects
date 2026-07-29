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

  function StatusSelect({ row }: { row: AdminEnrollment }) {
    return (
      <select
        value={row.status}
        onChange={(e) => updateStatus(row.id, e.target.value as EnrollmentStatus)}
        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-gray-200 text-sm"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Enrollments</h1>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No enrollments yet — connects once the backend is live.</p>
      ) : (
        <>
          {/* Mobile: stacked cards — avoids squeezing email/program/select into
              table columns that don't fit narrow screens. */}
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
                <div className="text-sm text-white font-medium truncate mb-1">{row.userEmail}</div>
                <div className="text-sm text-gray-400 mb-3">{row.programName}</div>
                <StatusSelect row={row} />
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <table className="w-full text-sm hidden md:table">
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
                  <td className="py-3 max-w-[220px] truncate">{row.userEmail}</td>
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
        </>
      )}
    </div>
  );
}
