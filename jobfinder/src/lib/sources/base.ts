import { htmlToText } from '@/lib/jobs/html';
import {
  extractSkills, parseLocation, toDateOrNull, toEmploymentType, toWorkArrangement,
} from '@/lib/jobs/normalize';
import { parseSalaryText } from '@/lib/jobs/salary';
import type { NormalizedJob } from '@/lib/jobs/schema';
import type { JobRef, ParsedJob, RawJob, SourceContext } from './types';

/**
 * Default normalizeJob(). Most connectors use this unchanged — the whole point
 * of ParsedJob is that the shared layer can finish the job. Override it only
 * when a source needs something genuinely site-specific.
 */
export function normalizeParsedJob(sourceId: string, parsed: ParsedJob): NormalizedJob {
  const descriptionText = htmlToText(parsed.descriptionHtml);
  const location = parseLocation(parsed.locationRaw, parsed.countryHint ?? null);
  const salary = parseSalaryText(parsed.salaryTextRaw);

  return {
    sourceId,
    externalJobId: parsed.externalJobId,
    title: parsed.title.trim().slice(0, 300),
    companyName: parsed.companyName.trim().slice(0, 200),
    companyUrl: parsed.companyUrl ?? null,
    descriptionHtml: parsed.descriptionHtml ?? null,
    descriptionText,
    locationRaw: location.raw,
    city: location.city,
    region: location.region,
    country: location.country,
    employmentType: toEmploymentType(parsed.employmentTypeRaw, parsed.title),
    workArrangement: toWorkArrangement({
      remoteFlag: parsed.remoteFlag ?? null,
      location: parsed.locationRaw ?? null,
      text: `${parsed.title} ${descriptionText?.slice(0, 2000) ?? ''}`,
    }),
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.currency,
    salaryPeriod: salary.period,
    postedAt: toDateOrNull(parsed.postedAtRaw),
    jobUrl: parsed.jobUrl,
    skills: extractSkills(descriptionText, parsed.tags ?? []),
    category: parsed.category ?? null,
    raw: parsed.raw,
  };
}

/** For API sources whose listing response already contains the whole job. */
export async function passthroughFetch<T>(
  ref: JobRef<T>,
  _ctx: SourceContext,
): Promise<RawJob<T>> {
  if (ref.payload === undefined) {
    throw new Error(`No inline payload for ${ref.externalJobId}; this connector must override fetchJob().`);
  }
  return { ref, payload: ref.payload };
}
