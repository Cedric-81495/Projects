import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/_auth';
import { runSource } from '@/lib/collect/run';
import { serviceClient } from '@/lib/db/supabase';
import { getConnector } from '@/lib/sources/registry';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** POST /api/admin/sources/:id/run — collect one source immediately. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;

  if (!getConnector(id)) {
    return NextResponse.json(
      { error: `No connector registered for '${id}'.` }, { status: 404 },
    );
  }

  try {
    const summary = await runSource(serviceClient(), id);
    // A partial run still returns 200: it did useful work and the detail is
    // in the summary. Only a hard failure is an error status.
    return NextResponse.json(summary, { status: summary.status === 'failed' ? 502 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Run failed', detail: (error as Error).message }, { status: 500 },
    );
  }
}
