import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatFreshness, formatSalary, locationLine } from '@/lib/format';
import type { JobSearchResult } from '@/types';

export function JobCard({ job }: { job: JobSearchResult }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod);

  return (
    <article className="rounded-card border border-line bg-paper-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold leading-snug text-ink">
            <Link href={`/jobs/${job.id}`} className="hover:text-moss-deep hover:underline">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-ink-muted">{job.companyName}</p>
          <p className="text-sm text-ink-muted">
            {locationLine(job.locationRaw, job.workArrangement, job.employmentType)}
          </p>
        </div>

        <a
          href={job.jobUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="shrink-0 rounded-card border border-moss px-3 py-1.5 text-sm font-medium text-moss-deep hover:bg-moss-wash"
        >
          View job
        </a>
      </div>

      <p className="mt-3 text-sm text-ink">
        {salary ?? <span className="text-ink-muted">Salary not listed</span>}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
        <span>{formatFreshness(job.postedAt, job.discoveredAt)}</span>
        <span aria-hidden>·</span>
        <span>Source: {job.sourceName}</span>
        {job.alsoOnCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>Also on {job.alsoOnCount} other {job.alsoOnCount === 1 ? 'board' : 'boards'}</span>
          </>
        )}
      </div>

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((skill) => <Badge key={skill}>{skill}</Badge>)}
        </div>
      )}
    </article>
  );
}
