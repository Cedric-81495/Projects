import { decodeEntities, looksEscaped } from '@/lib/jobs/html';
import type { ParsedJob } from '../types';
import type { ArbeitnowJob, ArbeitnowVariant } from './types';

/**
 * Salary is not a field on this API. A few postings put a compensation line
 * in the description ("Compensation: €90K – €160K"); we read that and nothing
 * else. No salary line means no salary — we do not estimate one.
 */
const COMPENSATION_LINE =
  /(?:compensation|salary|gehalt|verg(?:ü|u)tung)\s*[::]\s*([^<\n]{3,120})/i;

export function extractSalaryText(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = COMPENSATION_LINE.exec(html);
  return match ? match[1].trim() : null;
}

export function parseArbeitnowJob(job: ArbeitnowJob, variant: ArbeitnowVariant): ParsedJob {
  const description = job.description
    ? (looksEscaped(job.description) ? decodeEntities(job.description) : job.description)
    : null;

  return {
    externalJobId: job.slug,
    title: job.title,
    companyName: job.company_name,
    companyUrl: null,
    descriptionHtml: description,
    locationRaw: job.location ?? null,
    countryHint: variant.country ?? null,
    employmentTypeRaw: (job.job_types ?? []).join(' '),
    remoteFlag: job.remote ?? null,
    salaryTextRaw: extractSalaryText(description),
    postedAtRaw: job.created_at ?? null,
    jobUrl: job.url,
    tags: job.tags ?? [],
    category: (job.tags ?? [])[0] ?? null,
    raw: job,
  };
}
