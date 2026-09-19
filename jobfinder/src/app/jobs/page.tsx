import { Suspense } from 'react';
import { JobFilters } from '@/components/filters/job-filters';
import { JobFiltersSkeleton } from '@/components/filters/job-filters-skeleton';
import { JobList } from '@/components/jobs/job-list';
import { JobListSkeleton } from '@/components/jobs/job-card-skeleton';
import { SearchForm } from '@/components/search/search-form';
import { listPublicSources } from '@/lib/db/sources';
import { publicClient } from '@/lib/db/supabase';
import { paramsFromSearchParams, searchJobs } from '@/lib/search/query';

export const dynamic = 'force-dynamic';

// Next 16: searchParams and params arrive as Promises and must be awaited.
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;

  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) value.forEach((v) => sp.append(key, v));
    else if (value != null) sp.set(key, value);
  }
  const query = sp.toString();

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-10" />}>
        <SearchForm size="compact" />
      </Suspense>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        <Suspense fallback={<JobFiltersSkeleton />}>
          <SourceFilters />
        </Suspense>

        {/*
          Keyed on the query string: React discards the old subtree and shows
          the skeleton whenever a filter changes, while the sidebar above stays
          mounted and keeps focus.
        */}
        <Suspense key={query} fallback={<JobListSkeleton />}>
          <JobResults query={query} />
        </Suspense>
      </div>
    </div>
  );
}

async function SourceFilters() {
  const sources = await listPublicSources(publicClient()).catch(() => []);
  return <JobFilters sources={sources.map((s) => ({ id: s.id, name: s.name }))} />;
}

async function JobResults({ query }: { query: string }) {
  const params = paramsFromSearchParams(new URLSearchParams(query));

  try {
    const results = await searchJobs(params);
    return (
      <JobList
        jobs={results.jobs}
        total={results.total}
        page={results.page}
        totalPages={results.totalPages}
        query={query}
      />
    );
  } catch {
    return (
      <div className="rounded-card border border-line bg-paper-raised p-6">
        <p className="font-medium text-ink">Search is unavailable.</p>
        <p className="mt-2 text-sm text-ink-muted">
          The database did not answer. Confirm the Supabase credentials in your environment
          and that migrations 0001 and 0002 have been applied.
        </p>
      </div>
    );
  }
}
