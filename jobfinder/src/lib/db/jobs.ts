import type { SupabaseClient } from '@supabase/supabase-js';
import { canonicalUrl, companySlug } from '@/lib/jobs/fingerprint';
import type { NormalizedJob } from '@/lib/jobs/schema';
import { toAnnual } from '@/lib/jobs/salary';
import { dedupeKeys, findExistingJob } from '@/lib/jobs/deduplicate';

export interface UpsertOutcome {
  created: number;
  updated: number;
  duplicates: number;
}

async function ensureCompany(db: SupabaseClient, job: NormalizedJob): Promise<string | null> {
  const slug = companySlug(job.companyName);
  const existing = await db.from('companies').select('id').eq('slug', slug).maybeSingle();
  if (existing.data) return String(existing.data.id);

  const inserted = await db.from('companies')
    .insert({ name: job.companyName, slug, website: job.companyUrl })
    .select('id').maybeSingle();

  // A concurrent run may have inserted it first; re-read rather than fail.
  if (inserted.error) {
    const retry = await db.from('companies').select('id').eq('slug', slug).maybeSingle();
    return retry.data ? String(retry.data.id) : null;
  }
  return inserted.data ? String(inserted.data.id) : null;
}

function toRow(job: NormalizedJob, companyId: string | null, duplicateOf: string | null) {
  const keys = dedupeKeys(job);
  return {
    source_id: job.sourceId,
    external_job_id: job.externalJobId,
    title: job.title,
    company_id: companyId,
    company_name: job.companyName,
    company_url: job.companyUrl,
    description_html: job.descriptionHtml,
    description_text: job.descriptionText,
    location_raw: job.locationRaw,
    city: job.city,
    region: job.region,
    country: job.country,
    employment_type: job.employmentType,
    work_arrangement: job.workArrangement,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_currency: job.salaryCurrency,
    salary_period: job.salaryPeriod,
    salary_min_annual: toAnnual(job.salaryMin, job.salaryPeriod),
    salary_max_annual: toAnnual(job.salaryMax ?? job.salaryMin, job.salaryPeriod),
    posted_at: job.postedAt ? job.postedAt.toISOString() : null,
    job_url: job.jobUrl,
    canonical_url: canonicalUrl(job.jobUrl),
    skills: job.skills,
    category: job.category,
    fingerprint: keys.fingerprint,
    duplicate_of: duplicateOf,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    raw: job.raw ?? null,
  };
}

/**
 * Inserts new jobs, refreshes last_seen_at on ones we have seen before, and
 * links cross-source repeats to the first listing found. Duplicate rows are
 * kept so the job page can say which other boards carry the same posting.
 */
export async function upsertJobs(
  db: SupabaseClient,
  jobs: NormalizedJob[],
): Promise<UpsertOutcome> {
  const outcome: UpsertOutcome = { created: 0, updated: 0, duplicates: 0 };

  for (const job of jobs) {
    const keys = dedupeKeys(job);
    const existing = await findExistingJob(db, keys);

    if (existing && existing.sourceId === job.sourceId) {
      const companyId = await ensureCompany(db, job);
      const row = toRow(job, companyId, existing.duplicateOf);
      const { error } = await db.from('jobs').update(row).eq('id', existing.id);
      if (error) throw new Error(`Failed to update job ${existing.id}: ${error.message}`);
      outcome.updated += 1;
      continue;
    }

    // Same job, different board: store it, pointed at the original.
    const duplicateOf = existing ? (existing.duplicateOf ?? existing.id) : null;
    const companyId = await ensureCompany(db, job);
    const { error } = await db.from('jobs').insert(toRow(job, companyId, duplicateOf));

    if (error) {
      // Unique violation means another run inserted it between our read and write.
      if (error.code === '23505') { outcome.updated += 1; continue; }
      throw new Error(`Failed to insert job ${job.externalJobId}: ${error.message}`);
    }

    if (duplicateOf) outcome.duplicates += 1;
    else outcome.created += 1;
  }

  return outcome;
}

/**
 * Marks listings that a source stopped returning as inactive, so closed roles
 * drop out of search without being deleted.
 */
export async function deactivateStale(
  db: SupabaseClient,
  sourceId: string,
  runStartedAt: Date,
  graceDays = 7,
): Promise<number> {
  const cutoff = new Date(runStartedAt.getTime() - graceDays * 86_400_000).toISOString();
  const { data, error } = await db.from('jobs')
    .update({ is_active: false })
    .eq('source_id', sourceId).eq('is_active', true).lt('last_seen_at', cutoff)
    .select('id');
  if (error) throw new Error(`Failed to deactivate stale jobs: ${error.message}`);
  return data?.length ?? 0;
}
