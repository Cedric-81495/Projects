import { normalizeParsedJob, passthroughFetch } from '../base';
import type { JobRef, JobSourceConnector, ParsedJob, RawJob, SourceContext } from '../types';
import { parseArbeitnowJob } from './parser';
import { arbeitnowResponseSchema, type ArbeitnowJob, type ArbeitnowVariant } from './types';

interface Payload { job: ArbeitnowJob; variant: ArbeitnowVariant }

const DEFAULT_VARIANTS: ArbeitnowVariant[] = [
  { key: 'de', endpoint: 'https://www.arbeitnow.com/api/job-board-api', country: 'Germany' },
];

/**
 * Arbeitnow — free public job board API, documented at
 * https://www.arbeitnow.com/blog/job-board-api. No key, no auth.
 * It republishes ATS feeds (Greenhouse, SmartRecruiters, Join, Teamtailor,
 * Recruitee, Comeet) in one consistent JSON shape.
 *
 * Attribution back to arbeitnow.com is set on the source row and rendered
 * on every job card.
 */
export const arbeitnowConnector: JobSourceConnector<Payload> = {
  id: 'arbeitnow',
  name: 'Arbeitnow',
  homepage: 'https://www.arbeitnow.com',
  accessMethod: 'official_api',
  accessNotes:
    'Official free public API, no key required. Paginated with ?page=N. Attribution required.',

  async discoverJobs(ctx: SourceContext): Promise<JobRef<Payload>[]> {
    const variants = (ctx.config.variants as ArbeitnowVariant[] | undefined) ?? DEFAULT_VARIANTS;
    const refs: JobRef<Payload>[] = [];

    for (const variant of variants) {
      let page = 1;
      while (ctx.session.hasPageBudget()) {
        const url = `${variant.endpoint}?page=${page}`;
        const body = await ctx.session.fetchJson<unknown>(url);
        ctx.session.countPage();

        const parsed = arbeitnowResponseSchema.safeParse(body);
        if (!parsed.success) {
          ctx.log('Unexpected response shape; stopping this variant', {
            url, issues: parsed.error.issues.slice(0, 3),
          });
          break;
        }

        const jobs = parsed.data.data;
        if (jobs.length === 0) break;

        for (const job of jobs) {
          refs.push({ externalJobId: `${variant.key}:${job.slug}`, url: job.url, payload: { job, variant } });
        }

        const meta = parsed.data.meta;
        const hasNext = parsed.data.links?.next
          ?? (meta?.last_page != null && meta.current_page != null && meta.current_page < meta.last_page);
        if (!hasNext) break;
        page += 1;
      }
    }

    ctx.log(`Discovered ${refs.length} jobs`, { variants: variants.length });
    return refs;
  },

  fetchJob(ref, ctx): Promise<RawJob<Payload>> {
    return passthroughFetch(ref, ctx);
  },

  parseJob(raw: RawJob<Payload>): ParsedJob {
    const parsed = parseArbeitnowJob(raw.payload.job, raw.payload.variant);
    // Keep the variant prefix so the German and UK boards never collide.
    return { ...parsed, externalJobId: raw.ref.externalJobId };
  },

  normalizeJob(parsed) {
    return normalizeParsedJob('arbeitnow', parsed);
  },
};
