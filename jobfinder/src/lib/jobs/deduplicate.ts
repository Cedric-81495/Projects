import type { SupabaseClient } from '@supabase/supabase-js';
import { canonicalUrl, jobFingerprint } from './fingerprint';
import type { NormalizedJob } from './schema';

export interface DedupeKeys {
  sourceId: string;
  externalJobId: string;
  canonicalUrl: string;
  fingerprint: string;
}

export function dedupeKeys(job: NormalizedJob): DedupeKeys {
  return {
    sourceId: job.sourceId,
    externalJobId: job.externalJobId,
    canonicalUrl: canonicalUrl(job.jobUrl),
    fingerprint: jobFingerprint({
      companyName: job.companyName,
      title: job.title,
      locationRaw: job.locationRaw,
    }),
  };
}

/** Removes repeats inside a single collection batch before any database work. */
export function dedupeBatch(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of jobs) {
    const keys = dedupeKeys(job);
    const id = `${keys.sourceId}:${keys.externalJobId}`;
    if (seen.has(id) || seen.has(keys.canonicalUrl)) continue;
    seen.add(id);
    seen.add(keys.canonicalUrl);
    out.push(job);
  }
  return out;
}

/**
 * Four-stage match, cheapest and most certain first:
 *   1. source + external id   (the same posting, collected again)
 *   2. canonical job URL      (two boards linking to one posting)
 *   3. company + title + location fingerprint
 *
 * Returns the id of the job this one duplicates, or null if it is new.
 * The duplicate row is still stored — it carries its own source, so the UI can
 * show "also on X" without displaying the listing twice.
 */
export async function findExistingJob(
  db: SupabaseClient,
  keys: DedupeKeys,
): Promise<{ id: string; sourceId: string; duplicateOf: string | null } | null> {
  const select = 'id, source_id, duplicate_of';

  const bySource = await db.from('jobs').select(select)
    .eq('source_id', keys.sourceId).eq('external_job_id', keys.externalJobId).maybeSingle();
  if (bySource.data) return shape(bySource.data);

  const byUrl = await db.from('jobs').select(select)
    .eq('canonical_url', keys.canonicalUrl).limit(1).maybeSingle();
  if (byUrl.data) return shape(byUrl.data);

  const byFingerprint = await db.from('jobs').select(select)
    .eq('fingerprint', keys.fingerprint).is('duplicate_of', null).limit(1).maybeSingle();
  if (byFingerprint.data) return shape(byFingerprint.data);

  return null;
}

function shape(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    sourceId: String(row.source_id),
    duplicateOf: row.duplicate_of ? String(row.duplicate_of) : null,
  };
}
