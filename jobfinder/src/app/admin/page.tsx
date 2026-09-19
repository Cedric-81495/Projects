import { hasAdminSession } from '@/lib/admin-session';
import { listSources } from '@/lib/db/sources';
import { serviceClient } from '@/lib/db/supabase';
import { formatDateTime } from '@/lib/format';
import { AdminLogin } from './admin-login';
import { SourceTable } from './source-table';

export const dynamic = 'force-dynamic';

interface Stats {
  total_jobs: number; active_jobs: number; duplicate_jobs: number; jobs_today: number;
  sources_total: number; sources_enabled: number; sources_ok: number; sources_failed: number;
  last_collection: string | null; new_today: number; duplicates_today: number;
}

export default async function AdminPage() {
  // The gate runs before any query. An unauthenticated visitor never causes a
  // database read, so there is nothing to leak through timing or errors.
  if (!(await hasAdminSession())) {
    return <AdminLogin />;
  }

  // Past the gate, reads use the service role: migration 0003 revokes
  // admin_stats() and most source columns from the anon key.
  const db = serviceClient();
  const [statsResult, sources] = await Promise.all([
    db.rpc('admin_stats'),
    listSources(db).catch(() => []),
  ]);

  const stats = (statsResult.data ?? null) as Stats | null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Collection overview</h1>
          <p className="text-sm text-ink-muted">
            Signed in. Your session expires after 12 hours.
          </p>
        </div>
        <SignOut />
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total jobs" value={stats.total_jobs} />
          <Stat label="Active jobs" value={stats.active_jobs} />
          <Stat label="Collected today" value={stats.jobs_today} />
          <Stat label="New today" value={stats.new_today} />
          <Stat label="Duplicates held" value={stats.duplicate_jobs} />
          <Stat label="Duplicates today" value={stats.duplicates_today} />
          <Stat label="Sources enabled" value={`${stats.sources_enabled}/${stats.sources_total}`} />
          <Stat label="Sources failing" value={stats.sources_failed} />
          <div className="col-span-2 rounded-card border border-line bg-paper-raised p-3 sm:col-span-4">
            <p className="text-xs text-ink-muted">Last collection finished</p>
            <p className="mt-0.5 text-sm text-ink">{formatDateTime(stats.last_collection)}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-card border border-line bg-paper-raised p-4 text-sm text-ink-muted">
          Stats are unavailable. Apply the migrations and confirm the Supabase credentials.
        </p>
      )}

      <SourceTable
        sources={sources.map((s) => ({
          id: s.id, name: s.name, enabled: s.enabled,
          accessMethod: s.access_method,
          lastRunAt: s.last_run_at, lastStatus: s.last_status, lastError: s.last_error,
          everyMinutes: s.collect_every_minutes,
        }))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-card border border-line bg-paper-raised p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function SignOut() {
  return (
    <form action="/api/admin/logout" method="post">
      <button
        type="submit"
        className="rounded-card border border-line px-3 py-1.5 text-sm text-ink-muted
                   hover:border-moss hover:text-moss-deep"
      >
        Sign out
      </button>
    </form>
  );
}
