import { publicClient } from '@/lib/db/supabase';
import type { JobSearchParams, JobSearchResult, SortOption } from '@/types';

const SORTS: SortOption[] = ['recent', 'relevance', 'salary_desc', 'salary_asc'];

export interface SearchResponse {
  jobs: JobSearchResult[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * All search goes through the search_jobs SQL function, so filtering and
 * ranking live next to the indexes that serve them.
 */
export async function searchJobs(params: JobSearchParams): Promise<SearchResponse> {
  const perPage = clamp(params.perPage ?? 20, 1, 100);
  const page = Math.max(1, params.page ?? 1);
  const sort: SortOption = SORTS.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : 'recent';

  const db = publicClient();
  const { data, error } = await db.rpc('search_jobs', {
    p_query: params.q?.trim() || null,
    p_location: params.location?.trim() || null,
    p_country: params.country || null,
    p_employment_types: params.employmentTypes?.length ? params.employmentTypes : null,
    p_arrangements: params.arrangements?.length ? params.arrangements : null,
    p_posted_within_days: params.postedWithinDays ?? null,
    p_salary_min: params.salaryMin ?? null,
    p_salary_max: params.salaryMax ?? null,
    p_currency: params.currency || null,
    p_salary_only: params.salaryOnly ?? false,
    p_sources: params.sources?.length ? params.sources : null,
    // An empty query has nothing to rank, so fall back to newest first.
    p_sort: sort === 'relevance' && !params.q?.trim() ? 'recent' : sort,
    p_limit: perPage,
    p_offset: (page - 1) * perPage,
  });

  if (error) throw new Error(`Search failed: ${error.message}`);

  const rows = (data ?? []) as Record<string, any>[];
  const total = rows.length ? Number(rows[0].total_count) : 0;

  return {
    jobs: rows.map(toResult),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

function toResult(row: Record<string, any>): JobSearchResult {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.source_name,
    externalJobId: row.external_job_id,
    title: row.title,
    companyName: row.company_name,
    companyUrl: row.company_url ?? null,
    excerpt: row.description_text ?? '',
    locationRaw: row.location_raw ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    employmentType: row.employment_type,
    workArrangement: row.work_arrangement,
    salaryMin: row.salary_min != null ? Number(row.salary_min) : null,
    salaryMax: row.salary_max != null ? Number(row.salary_max) : null,
    salaryCurrency: row.salary_currency ?? null,
    salaryPeriod: row.salary_period ?? null,
    postedAt: row.posted_at ?? null,
    discoveredAt: row.discovered_at,
    lastSeenAt: row.last_seen_at,
    jobUrl: row.job_url,
    skills: row.skills ?? [],
    category: row.category ?? null,
    alsoOnCount: Number(row.duplicate_count ?? 0),
  };
}

/** Parses URLSearchParams into typed search params. Unknown values are dropped. */
export function paramsFromSearchParams(sp: URLSearchParams): JobSearchParams {
  const list = (key: string) => sp.getAll(key).flatMap((v) => v.split(',')).filter(Boolean);
  const num = (key: string) => {
    const raw = sp.get(key);
    const n = raw != null ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    q: sp.get('q') ?? undefined,
    location: sp.get('location') ?? undefined,
    country: sp.get('country') ?? undefined,
    employmentTypes: list('type') as JobSearchParams['employmentTypes'],
    arrangements: list('arrangement') as JobSearchParams['arrangements'],
    postedWithinDays: num('posted'),
    salaryMin: num('salaryMin'),
    salaryMax: num('salaryMax'),
    currency: sp.get('currency') ?? undefined,
    salaryOnly: sp.get('salaryOnly') === '1',
    sources: list('source'),
    sort: (sp.get('sort') as SortOption) ?? 'recent',
    page: num('page') ?? 1,
    perPage: num('perPage') ?? 20,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
