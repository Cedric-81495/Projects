import { decodeEntities, looksEscaped } from '@/lib/jobs/html';
import type { ParsedJob } from '../types';
import type { GreenhouseBoard, GreenhouseJob } from './types';

const SALARY_METADATA_KEYS = /salary|compensation|pay|range/i;

/** Employers may expose a salary through board metadata; read it if present. */
export function salaryFromMetadata(job: GreenhouseJob): string | null {
  for (const entry of job.metadata ?? []) {
    if (!entry?.name || !SALARY_METADATA_KEYS.test(entry.name)) continue;
    const { value } = entry;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value) && value.length) return value.filter(Boolean).join(' - ');
  }
  return null;
}

/**
 * Greenhouse has no remote flag. The signal lives in the location or office
 * names ("Remote - EU", "Remote, US"), and location.name can be a plain
 * country while an office says Remote — so both are checked.
 */
export function remoteHintFrom(job: GreenhouseJob): boolean | null {
  const names = [
    job.location?.name,
    ...(job.offices ?? []).map((o) => o?.name),
  ].filter((n): n is string => Boolean(n));
  if (names.length === 0) return null;
  if (names.some((n) => /\bremote\b|\bwork from home\b|\banywhere\b/i.test(n))) return true;
  return null;
}

export function locationFrom(job: GreenhouseJob): string | null {
  const primary = job.location?.name?.trim();
  if (primary) return primary;
  const offices = (job.offices ?? [])
    .map((o) => o?.name?.trim())
    .filter((n): n is string => Boolean(n) && n !== 'No Office');
  return offices.length ? offices.join('; ') : null;
}

export function parseGreenhouseJob(job: GreenhouseJob, board: GreenhouseBoard): ParsedJob {
  const content = job.content
    ? (looksEscaped(job.content) ? decodeEntities(job.content) : job.content)
    : null;

  const department = (job.departments ?? []).map((d) => d?.name).filter(Boolean)[0] ?? null;

  return {
    externalJobId: `${board.token}:${job.id}`,
    title: job.title,
    // Employer name, best source first: the field on the posting, then the
    // name configured or fetched for the board, then the raw token.
    companyName: job.company_name?.trim() || board.company?.trim() || board.token,
    companyUrl: board.companyUrl ?? null,
    descriptionHtml: content,
    locationRaw: locationFrom(job),
    countryHint: null,
    // Greenhouse has no employment-type field; the title and body carry it.
    employmentTypeRaw: null,
    remoteFlag: remoteHintFrom(job),
    salaryTextRaw: salaryFromMetadata(job),
    // first_published is the real posting date. updated_at is an edit
    // timestamp, so it is NOT used as a posting date — the job simply has
    // none, and the UI shows when we discovered it instead.
    postedAtRaw: job.first_published ?? null,
    jobUrl: job.absolute_url,
    tags: department ? [department] : [],
    category: department,
    raw: job,
  };
}
