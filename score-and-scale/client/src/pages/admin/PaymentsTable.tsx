// client/src/pages/admin/PaymentsTable.tsx  (NEW FILE)

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface AdminPayment {
  id: string;
  userEmail: string;
  programName: string;
  amountCents: number;
  status: 'succeeded' | 'failed' | 'refunded';
  braintreeTransactionId: string;
  createdAt: string;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function PaymentsTable() {
  const [rows, setRows] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdminPayment[]>('/api/admin/payments')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Payments</h1>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No payments yet.</p>
      ) : (
        <>
          {/* Mobile: stacked cards — same pattern as EnrollmentsTable.tsx */}
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
                <div className="text-sm text-white font-medium truncate mb-1">{row.userEmail}</div>
                <div className="text-sm text-gray-400 mb-2">{row.programName}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{formatPrice(row.amountCents)}</span>
                  <span className="text-gray-400 uppercase text-xs">{row.status}</span>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {new Date(row.createdAt).toLocaleDateString()} · {row.braintreeTransactionId}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="py-2 font-normal">User</th>
                <th className="py-2 font-normal">Program</th>
                <th className="py-2 font-normal">Amount</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-900">
                  <td className="py-3 max-w-[200px] truncate">{row.userEmail}</td>
                  <td className="py-3">{row.programName}</td>
                  <td className="py-3">{formatPrice(row.amountCents)}</td>
                  <td className="py-3 uppercase text-xs">{row.status}</td>
                  <td className="py-3 text-gray-400">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 text-gray-500 font-mono text-xs truncate max-w-[160px]">
                    {row.braintreeTransactionId}
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
