import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { publicClient } from '@/lib/db/supabase';
import {
  ARRANGEMENT_LABELS, EMPLOYMENT_LABELS, formatFreshness, formatSalary,
} from '@/lib/format';
import type { EmploymentType, SalaryPeriod, WorkArrangement } from '@/types';

export const dynamic = 'force-dynamic';

interface JobRow {
  id: string;
  title: string;
  company_name: string;
  company_url: string | null;
  description_html: string | null;
  description_text: string | null;
  location_raw: string | null;
  employment_type: EmploymentType;
  work_arrangement: WorkArrangement;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: SalaryPeriod | null;
  posted_at: string | null;
  discovered_at: string;
  job_url: string;
  skills: string[];
  category: string | null;
  source_id: string;
  sources: { name: string; homepage: string | null; attribution_text: string | null } | null;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = publicClient();
  const { data, error } = await db
    .from('jobs')
    .select('*, sources(name, homepage, attribution_text)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();
  const job = data as unknown as JobRow;

  const alternates = await db
    .from('jobs')
    .select('id, job_url, source_id, sources(name)')
    .eq('duplicate_of', job.id);

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);
  const sourceName = job.sources?.name ?? job.source_id;

  return (
    <article className="space-y-8">
      <Link href="/jobs" className="text-sm text-moss-deep hover:underline">← Back to results</Link>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{job.title}</h1>
        <p className="text-base text-ink-muted">
          {job.company_url ? (
            <a href={job.company_url} target="_blank" rel="noopener noreferrer nofollow"
               className="hover:text-moss-deep">{job.company_name}</a>
          ) : job.company_name}
        </p>

        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex h-11 items-center rounded-card bg-moss px-5 text-sm font-medium text-white no-underline hover:bg-moss-deep"
        >
          Apply on {sourceName}
        </a>
      </header>

      <dl className="grid gap-x-8 gap-y-4 rounded-card border border-line bg-paper-raised p-5 sm:grid-cols-2">
        <Detail label="Location" value={job.location_raw ?? 'Not specified'} />
        <Detail label="Employment type" value={EMPLOYMENT_LABELS[job.employment_type]} />
        <Detail label="Work arrangement" value={ARRANGEMENT_LABELS[job.work_arrangement]} />
        <Detail label="Salary" value={salary ?? 'Not listed by the source'} />
        <Detail label="Date posted" value={formatFreshness(job.posted_at, job.discovered_at)} />
        <Detail label="Source" value={sourceName} />
      </dl>

      {job.skills.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
          </div>
        </section>
      )}

      {job.description_text && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Description</h2>
          <div className="max-w-[68ch] whitespace-pre-line text-sm leading-relaxed text-ink">
            {job.description_text.slice(0, 6000)}
          </div>
        </section>
      )}

      {alternates.data && alternates.data.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">Also listed on</h2>
          <ul className="space-y-1 text-sm">
            {alternates.data.map((alt: any) => (
              <li key={alt.id}>
                <a href={alt.job_url} target="_blank" rel="noopener noreferrer nofollow"
                   className="text-moss-deep hover:underline">
                  {alt.sources?.name ?? alt.source_id}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="border-t border-line pt-4 text-xs text-ink-muted">
        {job.sources?.attribution_text
          ?? `Listing collected from ${sourceName}. The full posting lives on the source site.`}
      </p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}
