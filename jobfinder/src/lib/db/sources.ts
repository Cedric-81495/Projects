import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccessMethod, RunStatus } from '@/types';

export interface SourceRow {
  id: string;
  name: string;
  homepage: string | null;
  access_method: AccessMethod;
  enabled: boolean;
  request_delay_ms: number;
  max_requests_per_run: number;
  max_pages_per_run: number;
  retry_limit: number;
  collect_every_minutes: number;
  respect_robots: boolean;
  config: Record<string, unknown>;
  attribution_required: boolean;
  attribution_text: string | null;
  notes: string | null;
  last_run_at: string | null;
  last_status: RunStatus | null;
  last_error: string | null;
}

/** Columns the anon key is allowed to read — see migration 0003. */
const PUBLIC_SOURCE_COLUMNS = 'id, name, homepage, attribution_required, attribution_text';

export interface PublicSource {
  id: string;
  name: string;
  homepage: string | null;
  attribution_required: boolean;
  attribution_text: string | null;
}

/** For the site. Never selects crawl policy, connector config or errors. */
export async function listPublicSources(db: SupabaseClient): Promise<PublicSource[]> {
  const { data, error } = await db.from('sources').select(PUBLIC_SOURCE_COLUMNS).order('id');
  if (error) throw new Error(`Failed to list sources: ${error.message}`);
  return (data ?? []) as unknown as PublicSource[];
}

/** For the admin area and the collector. Requires the service role key. */
export async function listSources(db: SupabaseClient): Promise<SourceRow[]> {
  const { data, error } = await db.from('sources').select('*').order('id');
  if (error) throw new Error(`Failed to list sources: ${error.message}`);
  return (data ?? []) as SourceRow[];
}

export async function getSource(db: SupabaseClient, id: string): Promise<SourceRow | null> {
  const { data, error } = await db.from('sources').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to load source ${id}: ${error.message}`);
  return (data as SourceRow) ?? null;
}

/** Sources that are enabled and whose collect_every_minutes window has elapsed. */
export async function listDueSources(db: SupabaseClient): Promise<SourceRow[]> {
  const sources = await listSources(db);
  const now = Date.now();
  return sources.filter((s) => {
    if (!s.enabled) return false;
    if (!s.last_run_at) return true;
    const elapsedMinutes = (now - new Date(s.last_run_at).getTime()) / 60_000;
    return elapsedMinutes >= s.collect_every_minutes;
  });
}

export async function setSourceEnabled(db: SupabaseClient, id: string, enabled: boolean) {
  const { error } = await db.from('sources').update({ enabled }).eq('id', id);
  if (error) throw new Error(`Failed to update source ${id}: ${error.message}`);
}
