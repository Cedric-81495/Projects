import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/_auth';
import { listSources, setSourceEnabled } from '@/lib/db/sources';
import { serviceClient } from '@/lib/db/supabase';
import { connectorIds } from '@/lib/sources/registry';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = serviceClient();
    const sources = await listSources(db);
    const registered = connectorIds();

    const recent = await db
      .from('collection_runs')
      .select('source_id, status, started_at, finished_at, jobs_found, jobs_new, duplicates_found, error_message')
      .order('started_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      sources: sources.map((s) => ({
        ...s,
        connector_registered: registered.includes(s.id),
      })),
      // A row in the table without a connector in the registry is a real
      // misconfiguration, so surface it rather than failing silently at run time.
      orphaned_rows: sources.filter((s) => !registered.includes(s.id)).map((s) => s.id),
      unregistered_connectors: registered.filter((id) => !sources.some((s) => s.id === id)),
      recent_runs: recent.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load sources', detail: (error as Error).message }, { status: 500 },
    );
  }
}

const patchSchema = z.object({ id: z.string().min(1), enabled: z.boolean() });

export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Expected { id: string, enabled: boolean }' }, { status: 400 });
  }

  try {
    await setSourceEnabled(serviceClient(), parsed.data.id, parsed.data.enabled);
    return NextResponse.json({ id: parsed.data.id, enabled: parsed.data.enabled });
  } catch (error) {
    return NextResponse.json(
      { error: 'Update failed', detail: (error as Error).message }, { status: 500 },
    );
  }
}
