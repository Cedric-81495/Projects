import type { SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import { deactivateStale, upsertJobs } from '@/lib/db/jobs';
import { getSource, listDueSources, listSources, type SourceRow } from '@/lib/db/sources';
import { dedupeBatch } from '@/lib/jobs/deduplicate';
import { validateJobs, type NormalizedJob } from '@/lib/jobs/schema';
import { CrawlSession } from '@/lib/scraping/http';
import { BudgetExceededError, DisallowedByRobotsError, SourceHttpError } from '@/lib/scraping/errors';
import { getConnector } from '@/lib/sources/registry';
import type { SourceContext } from '@/lib/sources/types';
import type { RunStatus } from '@/types';

export interface RunSummary {
  sourceId: string;
  status: RunStatus;
  jobsFound: number;
  jobsNew: number;
  jobsUpdated: number;
  duplicates: number;
  invalid: number;
  deactivated: number;
  requests: number;
  pages: number;
  error?: string;
  durationMs: number;
}

/**
 * Collects one source end to end. Every failure mode is recorded against the
 * run and the source; nothing here is allowed to throw past the caller, so one
 * broken site can never take down a collection cycle.
 */
export async function runSource(db: SupabaseClient, sourceId: string): Promise<RunSummary> {
  const startedAt = new Date();
  const source = await getSource(db, sourceId);

  if (!source) {
    return emptySummary(sourceId, 'failed', `Unknown source '${sourceId}'.`, startedAt);
  }
  const connector = getConnector(sourceId);
  if (!connector) {
    await markSource(db, sourceId, 'failed', `No connector registered for '${sourceId}'.`);
    return emptySummary(sourceId, 'failed', `No connector registered for '${sourceId}'.`, startedAt);
  }

  const run = await db.from('collection_runs')
    .insert({ source_id: sourceId, status: 'running' }).select('id').maybeSingle();
  const runId = run.data ? String(run.data.id) : null;

  const session = new CrawlSession(sourceId, {
    userAgent: serverEnv().CRAWLER_USER_AGENT,
    requestDelayMs: source.request_delay_ms,
    maxRequestsPerRun: source.max_requests_per_run,
    maxPagesPerRun: source.max_pages_per_run,
    retryLimit: source.retry_limit,
    respectRobots: source.respect_robots,
  });

  const logs: string[] = [];
  const ctx: SourceContext = {
    session,
    config: source.config ?? {},
    log: (message, meta) => logs.push(meta ? `${message} ${JSON.stringify(meta)}` : message),
  };

  let status: RunStatus = 'success';
  let errorMessage: string | undefined;
  let found = 0;
  let invalid = 0;
  const normalized: NormalizedJob[] = [];

  try {
    const refs = await connector.discoverJobs(ctx);
    found = refs.length;

    const candidates: unknown[] = [];
    for (const ref of refs) {
      try {
        const raw = await connector.fetchJob(ref, ctx);
        const parsed = connector.parseJob(raw, ctx);
        candidates.push(connector.normalizeJob(parsed, ctx));
      } catch (error) {
        if (error instanceof BudgetExceededError) throw error;
        invalid += 1;
        await recordError(db, runId, sourceId, ref.url, error);
      }
    }

    const valid = validateJobs(candidates, (issue) => {
      invalid += 1;
      logs.push(`Dropped invalid job: ${issue}`);
    });
    normalized.push(...dedupeBatch(valid));
  } catch (error) {
    status = normalized.length > 0 ? 'partial' : 'failed';
    errorMessage = describe(error);
    // A budget stop is an expected, healthy outcome, not a failure.
    if (error instanceof BudgetExceededError) status = 'partial';
    await recordError(db, runId, sourceId, null, error);
  }

  let created = 0, updated = 0, duplicates = 0, deactivated = 0;
  try {
    const outcome = await upsertJobs(db, normalized);
    created = outcome.created;
    updated = outcome.updated;
    duplicates = outcome.duplicates;
    if (status === 'success' && normalized.length > 0) {
      deactivated = await deactivateStale(db, sourceId, startedAt);
    }
  } catch (error) {
    status = 'partial';
    errorMessage = describe(error);
    await recordError(db, runId, sourceId, null, error);
  }

  if (invalid > 0 && status === 'success') status = 'partial';

  const summary: RunSummary = {
    sourceId, status,
    jobsFound: found, jobsNew: created, jobsUpdated: updated,
    duplicates, invalid, deactivated,
    requests: session.requestsMade, pages: session.pagesFetched,
    error: errorMessage,
    durationMs: Date.now() - startedAt.getTime(),
  };

  if (runId) {
    await db.from('collection_runs').update({
      status, finished_at: new Date().toISOString(),
      requests_made: summary.requests, pages_fetched: summary.pages,
      jobs_found: found, jobs_new: created, jobs_updated: updated,
      duplicates_found: duplicates, error_message: errorMessage ?? null,
    }).eq('id', runId);
  }

  await markSource(db, sourceId, status, errorMessage ?? null);
  return summary;
}

/** Runs every source that is enabled and due. Failures are isolated per source. */
export async function runDueSources(db: SupabaseClient): Promise<RunSummary[]> {
  const due = await listDueSources(db);
  const summaries: RunSummary[] = [];
  for (const source of due) {
    summaries.push(await runSource(db, source.id));
  }
  return summaries;
}

export async function runAllEnabled(db: SupabaseClient): Promise<RunSummary[]> {
  const sources: SourceRow[] = (await listSources(db)).filter((s) => s.enabled);
  const summaries: RunSummary[] = [];
  for (const source of sources) {
    summaries.push(await runSource(db, source.id));
  }
  return summaries;
}

async function markSource(db: SupabaseClient, id: string, status: RunStatus, error: string | null) {
  await db.from('sources').update({
    last_run_at: new Date().toISOString(), last_status: status, last_error: error,
  }).eq('id', id);
}

async function recordError(
  db: SupabaseClient, runId: string | null, sourceId: string,
  url: string | null, error: unknown,
) {
  const http = error instanceof SourceHttpError ? error : null;
  await db.from('collection_errors').insert({
    run_id: runId,
    source_id: sourceId,
    url: http?.url ?? url,
    http_status: http?.status ?? null,
    retry_count: http?.retryCount ?? 0,
    message: describe(error).slice(0, 2000),
    stack: error instanceof Error ? error.stack?.slice(0, 4000) ?? null : null,
  });
}

function describe(error: unknown): string {
  if (error instanceof DisallowedByRobotsError) return `Blocked by robots.txt: ${error.url}`;
  if (error instanceof SourceHttpError) {
    return `HTTP ${error.status ?? '?'} after ${error.retryCount} retries: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function emptySummary(sourceId: string, status: RunStatus, error: string, startedAt: Date): RunSummary {
  return {
    sourceId, status, jobsFound: 0, jobsNew: 0, jobsUpdated: 0,
    duplicates: 0, invalid: 0, deactivated: 0, requests: 0, pages: 0,
    error, durationMs: Date.now() - startedAt.getTime(),
  };
}
