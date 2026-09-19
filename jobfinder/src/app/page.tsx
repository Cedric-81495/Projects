import Link from 'next/link';
import { Suspense } from 'react';
import { JobCard } from '@/components/jobs/job-card';
import { JobCardSkeleton } from '@/components/jobs/job-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchForm } from '@/components/search/search-form';
import { searchJobs } from '@/lib/search/query';
import type { JobSearchResult } from '@/types';

export const revalidate = 300;

const SHELVES = [
  { title: 'Latest jobs', href: '/jobs', params: {} },
  { title: 'Remote jobs', href: '/jobs?arrangement=remote', params: { arrangements: ['remote' as const] } },
  { title: 'Full-time jobs', href: '/jobs?type=full_time', params: { employmentTypes: ['full_time' as const] } },
  { title: 'Part-time jobs', href: '/jobs?type=part_time', params: { employmentTypes: ['part_time' as const] } },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Find your next job
          </h1>
          <p className="max-w-xl text-base text-ink-muted">
            Search jobs from multiple sources in one place.
          </p>
        </div>
        <Suspense fallback={<div className="h-12" />}>
          <SearchForm />
        </Suspense>
      </section>

      {SHELVES.map((shelf) => (
        <Suspense key={shelf.title} fallback={<ShelfSkeleton />}>
          <Shelf title={shelf.title} href={shelf.href} params={shelf.params} />
        </Suspense>
      ))}
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <section className="space-y-3" aria-busy="true">
      <Skeleton className="h-6 w-36" />
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => <JobCardSkeleton key={i} />)}
      </div>
    </section>
  );
}

async function Shelf({
  title, href, params,
}: {
  title: string; href: string; params: Record<string, unknown>;
}) {
  let jobs: JobSearchResult[] = [];
  let failed = false;
  try {
    const result = await searchJobs({ ...params, perPage: 4, sort: 'recent' });
    jobs = result.jobs;
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="rounded-card border border-line bg-paper-raised p-4 text-sm text-ink-muted">
          Jobs could not be loaded. Check that the database is reachable and that a collection
          run has completed.
        </p>
      </section>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <Link href={href} className="text-sm text-moss-deep hover:underline">See all</Link>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} />)}
      </div>
    </section>
  );
}
