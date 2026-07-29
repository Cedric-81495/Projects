import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Kpis {
  totalEnrollments: number;
  activeEnrollments: number;
  newContactSubmissions: number;
  revenueThisMonthCents: number;
}

export function AdminHome() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    apiFetch<Kpis>('/api/admin/kpis').then(setKpis).catch(() => setKpis(null));
  }, []);

  const cards = [
    { label: 'Total Enrollments', value: kpis?.totalEnrollments },
    { label: 'Active Enrollments', value: kpis?.activeEnrollments },
    { label: 'New Contact Submissions', value: kpis?.newContactSubmissions },
    { label: 'Revenue This Month', value: kpis ? `$${(kpis.revenueThisMonthCents / 100).toLocaleString()}` : undefined },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-8">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-gray-800 rounded p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{c.label}</div>
            <div className="text-2xl font-semibold text-white">{c.value ?? '—'}</div>
          </div>
        ))}
      </div>
      {!kpis && <p className="text-sm text-gray-500 mt-6">Waiting on the backend for live numbers.</p>}
    </div>
  );
}
