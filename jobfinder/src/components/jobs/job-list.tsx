import Link from 'next/link';
import { JobCard } from './job-card';
import type { JobSearchResult } from '@/types';

interface Props {
  jobs: JobSearchResult[];
  total: number;
  page: number;
  totalPages: number;
  query: string;
}

export function JobList({ jobs, total, page, totalPages, query }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-paper-raised p-8 text-center">
        <p className="text-base font-medium text-ink">No jobs match these filters yet.</p>
        <p className="mt-2 text-sm text-ink-muted">
          Try a broader job title, clear the location, or widen the date range.
          New listings arrive with each collection run.
        </p>
      </div>
    );
  }

  const pageLink = (target: number) => {
    const next = new URLSearchParams(query);
    next.set('page', String(target));
    return `/jobs?${next.toString()}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        {total.toLocaleString()} {total === 1 ? 'job' : 'jobs'}
      </p>

      <div className="space-y-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} />)}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-2 text-sm" aria-label="Pagination">
          {page > 1
            ? <Link href={pageLink(page - 1)} className="text-moss-deep hover:underline">Previous</Link>
            : <span className="text-ink-muted/60">Previous</span>}
          <span className="text-ink-muted">Page {page} of {totalPages}</span>
          {page < totalPages
            ? <Link href={pageLink(page + 1)} className="text-moss-deep hover:underline">Next</Link>
            : <span className="text-ink-muted/60">Next</span>}
        </nav>
      )}
    </div>
  );
}
