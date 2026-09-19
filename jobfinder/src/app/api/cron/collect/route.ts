import { NextResponse } from 'next/server';
import { requireCron } from '@/app/api/_auth';
import { runDueSources } from '@/lib/collect/run';
import { serviceClient } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
// Vercel's Hobby plan caps a function at 60s. Keep per-source budgets small
// enough to finish inside it; see docs/ARCHITECTURE.md for the worker option
// when a source needs longer.
export const maxDuration = 60;

export async function GET(request: Request) {
  const denied = requireCron(request);
  if (denied) return denied;

  try {
    const summaries = await runDueSources(serviceClient());
    const failed = summaries.filter((s) => s.status === 'failed');

    return NextResponse.json({
      ranAt: new Date().toISOString(),
      sourcesRun: summaries.length,
      totals: {
        found: sum(summaries, (s) => s.jobsFound),
        new: sum(summaries, (s) => s.jobsNew),
        updated: sum(summaries, (s) => s.jobsUpdated),
        duplicates: sum(summaries, (s) => s.duplicates),
      },
      failed: failed.map((s) => ({ source: s.sourceId, error: s.error })),
      summaries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Collection cycle failed', detail: (error as Error).message }, { status: 500 },
    );
  }
}

export const POST = GET;

function sum<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
