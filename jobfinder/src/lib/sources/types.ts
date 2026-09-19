import type { CrawlSession } from '@/lib/scraping/http';
import type { NormalizedJob } from '@/lib/jobs/schema';
import type { AccessMethod } from '@/types';

/**
 * A reference to one job discovered on a source. For API and feed sources the
 * full payload usually arrives with the listing, so `payload` is populated and
 * fetchJob() short-circuits. For HTML sources it is a URL to fetch.
 */
export interface JobRef<TPayload = unknown> {
  externalJobId: string;
  url: string;
  payload?: TPayload;
}

/** Whatever the source returned for a single job, before any interpretation. */
export interface RawJob<TPayload = unknown> {
  ref: JobRef<TPayload>;
  payload: TPayload;
}

/**
 * Connector-shaped job: field extraction is done, value normalization is not.
 * Splitting parse from normalize keeps the site-specific regexes in one file
 * and the shared vocabulary (employment types, locations) in another.
 */
export interface ParsedJob {
  externalJobId: string;
  title: string;
  companyName: string;
  companyUrl?: string | null;
  descriptionHtml?: string | null;
  locationRaw?: string | null;
  countryHint?: string | null;
  employmentTypeRaw?: string | null;
  remoteFlag?: boolean | null;
  salaryTextRaw?: string | null;
  postedAtRaw?: string | number | Date | null;
  jobUrl: string;
  tags?: string[];
  category?: string | null;
  raw?: unknown;
}

export interface SourceContext {
  session: CrawlSession;
  /** The `config` jsonb column for this source row. */
  config: Record<string, unknown>;
  log: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * The contract every job site adapter implements. The core application knows
 * only this interface — adding a site means adding one of these, nothing else.
 */
export interface JobSourceConnector<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly homepage: string;
  readonly accessMethod: AccessMethod;
  /** Human-readable note on why this access method is permitted. */
  readonly accessNotes: string;

  discoverJobs(ctx: SourceContext): Promise<JobRef<TPayload>[]>;
  fetchJob(ref: JobRef<TPayload>, ctx: SourceContext): Promise<RawJob<TPayload>>;
  parseJob(raw: RawJob<TPayload>, ctx: SourceContext): ParsedJob;
  normalizeJob(parsed: ParsedJob, ctx: SourceContext): NormalizedJob;
}
