// client/src/components/dashboard/PaymentHistory.tsx  (NEW FILE)

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface PaymentRow {
  id: string;
  programName: string;
  amountCents: number;
  status: 'succeeded' | 'failed' | 'refunded';
  braintreeTransactionId: string;
  createdAt: string;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

const STATUS_STYLES: Record<PaymentRow['status'], string> = {
  succeeded: 'text-teal-600 dark:text-teal-400',
  failed: 'text-red-600 dark:text-red-400',
  refunded: 'text-amber-600 dark:text-amber-400',
};

export function PaymentHistory() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PaymentRow[]>('/api/payments')
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#232323] bg-white dark:bg-[#111111] p-6">
      <h2 className="text-[17px] font-medium text-gray-900 dark:text-white mb-5">Payment History</h2>

      {loading ? (
        <p className="text-gray-500 dark:text-[#9A9A9A] text-sm">Loading payment history…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 dark:text-[#9A9A9A] text-sm">No payments yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-[#1c1c1c] last:border-0 pb-3 last:pb-0"
            >
              <div className="min-w-0">
                <div className="text-gray-900 dark:text-white font-medium truncate">{row.programName}</div>
                <div className="text-xs text-gray-400 dark:text-[#6F6F6F] font-mono">
                  {new Date(row.createdAt).toLocaleDateString()} · {row.braintreeTransactionId}
                </div>
              </div>
              <div className="text-right shrink-0 pl-4">
                <div className="text-gray-900 dark:text-white font-medium">{formatPrice(row.amountCents)}</div>
                <div className={`text-xs uppercase tracking-wide font-mono ${STATUS_STYLES[row.status]}`}>
                  {row.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
