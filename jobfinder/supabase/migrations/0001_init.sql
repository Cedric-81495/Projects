-- JobFinder — initial schema
-- Run with:  supabase db push     (or paste into the Supabase SQL editor)

-- gen_random_uuid() is core since PostgreSQL 13, so pgcrypto is not required.
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type employment_type as enum
    ('full_time','part_time','contract','temporary','hourly','internship','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_arrangement as enum ('remote','hybrid','onsite','unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type salary_period as enum ('hourly','daily','weekly','monthly','yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type access_method as enum
    ('official_api','rss','json_endpoint','structured_data','html','unsupported');
exception when duplicate_object then null; end $$;

do $$ begin
  create type run_status as enum ('running','success','partial','failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------------
create table if not exists sources (
  id                    text primary key,              -- 'arbeitnow', 'greenhouse'
  name                  text not null,
  homepage              text,
  access_method         access_method not null,
  enabled               boolean not null default true,

  -- per-source crawl policy (see docs/SOURCES.md)
  request_delay_ms      integer not null default 1000,
  max_requests_per_run  integer not null default 25,
  max_pages_per_run     integer not null default 5,
  retry_limit           integer not null default 3,
  collect_every_minutes integer not null default 360,
  respect_robots        boolean not null default true,

  -- connector-specific settings (e.g. greenhouse board tokens)
  config                jsonb not null default '{}'::jsonb,

  attribution_required  boolean not null default false,
  attribution_text      text,
  notes                 text,

  last_run_at           timestamptz,
  last_status           run_status,
  last_error            text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,          -- normalized name, used for dedupe
  website     text,
  created_at  timestamptz not null default now()
);

create index if not exists companies_name_trgm_idx on companies using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Search document
--
-- A generated column may only call IMMUTABLE functions, and array_to_string is
-- marked STABLE (it invokes type output functions, which in general can depend
-- on settings such as TimeZone). For text[] it is deterministic, so the
-- standard fix is to wrap the whole expression in an immutable function.
--
-- Note: changing this function does NOT recompute already-stored rows. After
-- editing it, force a rewrite with:
--   alter table jobs alter column search_vector drop expression;  -- then re-add
-- or simply re-run the collector.
-- ---------------------------------------------------------------------------
create or replace function jobs_search_document(
  p_title       text,
  p_company     text,
  p_skills      text[],
  p_location    text,
  p_description text
) returns tsvector
language sql
immutable
parallel safe
as $$
  select setweight(to_tsvector('english', coalesce(p_title, '')),                        'A')
      || setweight(to_tsvector('english', coalesce(p_company, '')),                      'B')
      || setweight(to_tsvector('english', coalesce(array_to_string(p_skills, ' '), '')), 'B')
      || setweight(to_tsvector('english', coalesce(p_location, '')),                     'C')
      || setweight(to_tsvector('english', left(coalesce(p_description, ''), 20000)),     'D');
$$;

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create table if not exists jobs (
  id                 uuid primary key default gen_random_uuid(),

  source_id          text not null references sources(id) on delete cascade,
  external_job_id    text not null,

  title              text not null,
  company_id         uuid references companies(id) on delete set null,
  company_name       text not null,
  company_url        text,

  description_html   text,
  description_text   text,

  location_raw       text,
  city               text,
  region             text,
  country            text,

  employment_type    employment_type not null default 'other',
  work_arrangement   work_arrangement not null default 'unknown',

  -- salary is nullable: most listings do not publish one
  salary_min         numeric(12,2),
  salary_max         numeric(12,2),
  salary_currency    text,
  salary_period      salary_period,
  -- normalized to a yearly figure in the same currency, for sorting/filtering only
  salary_min_annual  numeric(14,2),
  salary_max_annual  numeric(14,2),

  -- freshness: posted_at is NULL when the source does not publish one.
  -- Never backfill it with discovered_at.
  posted_at          timestamptz,
  discovered_at      timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),

  job_url            text not null,
  canonical_url      text,                     -- job_url stripped of tracking params

  skills             text[] not null default '{}',
  category           text,

  fingerprint        text not null,            -- company+title+location hash
  duplicate_of       uuid references jobs(id) on delete set null,

  is_active          boolean not null default true,
  raw                jsonb,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  search_vector tsvector generated always as (
    jobs_search_document(title, company_name, skills, location_raw, description_text)
  ) stored,

  constraint jobs_source_external_uniq unique (source_id, external_job_id)
);

create index if not exists jobs_search_idx        on jobs using gin (search_vector);
create index if not exists jobs_title_trgm_idx    on jobs using gin (title gin_trgm_ops);
create index if not exists jobs_company_trgm_idx  on jobs using gin (company_name gin_trgm_ops);
create index if not exists jobs_location_trgm_idx on jobs using gin (location_raw gin_trgm_ops);
create index if not exists jobs_posted_idx        on jobs (coalesce(posted_at, discovered_at) desc);
create index if not exists jobs_employment_idx    on jobs (employment_type);
create index if not exists jobs_arrangement_idx   on jobs (work_arrangement);
create index if not exists jobs_country_idx       on jobs (country);
create index if not exists jobs_salary_idx        on jobs (salary_min_annual);
create index if not exists jobs_source_idx        on jobs (source_id);
create index if not exists jobs_fingerprint_idx   on jobs (fingerprint);
create index if not exists jobs_canonical_idx     on jobs (canonical_url);
create index if not exists jobs_active_idx        on jobs (is_active, duplicate_of);

-- ---------------------------------------------------------------------------
-- Collection history
-- ---------------------------------------------------------------------------
create table if not exists collection_runs (
  id                uuid primary key default gen_random_uuid(),
  source_id         text not null references sources(id) on delete cascade,
  status            run_status not null default 'running',
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  requests_made     integer not null default 0,
  pages_fetched     integer not null default 0,
  jobs_found        integer not null default 0,
  jobs_new          integer not null default 0,
  jobs_updated      integer not null default 0,
  duplicates_found  integer not null default 0,
  error_message     text
);

create index if not exists runs_source_started_idx on collection_runs (source_id, started_at desc);

create table if not exists collection_errors (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid references collection_runs(id) on delete cascade,
  source_id    text not null references sources(id) on delete cascade,
  url          text,
  http_status  integer,
  retry_count  integer not null default 0,
  message      text not null,
  stack        text,
  occurred_at  timestamptz not null default now()
);

create index if not exists errors_source_time_idx on collection_errors (source_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

drop trigger if exists jobs_touch on jobs;
create trigger jobs_touch before update on jobs
  for each row execute function touch_updated_at();

drop trigger if exists sources_touch on sources;
create trigger sources_touch before update on sources
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Search RPC
--
-- One function holds all search/filter/sort logic so the app never builds SQL
-- by hand. Jobs marked as duplicates are excluded; their source is still
-- reachable through jobs.duplicate_of.
-- ---------------------------------------------------------------------------
create or replace function search_jobs(
  p_query            text default null,
  p_location         text default null,
  p_country          text default null,
  p_employment_types text[] default null,
  p_arrangements     text[] default null,
  p_posted_within_days integer default null,
  p_salary_min       numeric default null,
  p_salary_max       numeric default null,
  p_currency         text default null,
  p_salary_only      boolean default false,
  p_sources          text[] default null,
  p_sort             text default 'recent',   -- recent | relevance | salary_desc | salary_asc
  p_limit            integer default 20,
  p_offset           integer default 0
)
returns table (
  id uuid, source_id text, source_name text, external_job_id text,
  title text, company_name text, company_url text,
  description_text text, location_raw text, city text, region text, country text,
  employment_type employment_type, work_arrangement work_arrangement,
  salary_min numeric, salary_max numeric, salary_currency text, salary_period salary_period,
  posted_at timestamptz, discovered_at timestamptz, last_seen_at timestamptz,
  job_url text, skills text[], category text,
  duplicate_count bigint, rank real, total_count bigint
)
language sql stable as $$
  with q as (
    select case
      when p_query is null or btrim(p_query) = '' then null
      else websearch_to_tsquery('english', p_query)
    end as tsq
  ),
  filtered as (
    select j.*, s.name as src_name,
           case when (select tsq from q) is null then 0::real
                else ts_rank(j.search_vector, (select tsq from q)) end as rank
    from jobs j
    join sources s on s.id = j.source_id
    where j.is_active
      and j.duplicate_of is null
      and ((select tsq from q) is null or j.search_vector @@ (select tsq from q))
      and (p_location is null or btrim(p_location) = ''
           or j.location_raw ilike '%' || p_location || '%'
           or j.city        ilike '%' || p_location || '%'
           or j.region      ilike '%' || p_location || '%'
           or j.country     ilike '%' || p_location || '%'
           or (lower(p_location) = 'remote' and j.work_arrangement = 'remote'))
      and (p_country is null or j.country = p_country)
      and (p_employment_types is null
           or j.employment_type::text = any(p_employment_types))
      and (p_arrangements is null
           or j.work_arrangement::text = any(p_arrangements))
      and (p_posted_within_days is null
           or coalesce(j.posted_at, j.discovered_at)
              >= now() - make_interval(days => p_posted_within_days))
      and (p_sources is null or j.source_id = any(p_sources))
      -- Jobs without salary data are kept unless the user opts into salary-only.
      and (not p_salary_only or j.salary_min_annual is not null)
      and (p_salary_min is null
           or (p_salary_only and j.salary_max_annual >= p_salary_min)
           or (not p_salary_only
               and (j.salary_max_annual is null or j.salary_max_annual >= p_salary_min)))
      and (p_salary_max is null
           or (p_salary_only and j.salary_min_annual <= p_salary_max)
           or (not p_salary_only
               and (j.salary_min_annual is null or j.salary_min_annual <= p_salary_max)))
      and (p_currency is null or j.salary_currency is null or j.salary_currency = p_currency)
  ),
  counted as (select count(*) as n from filtered)
  select f.id, f.source_id, f.src_name, f.external_job_id,
         f.title, f.company_name, f.company_url,
         left(coalesce(f.description_text,''), 400), f.location_raw, f.city, f.region, f.country,
         f.employment_type, f.work_arrangement,
         f.salary_min, f.salary_max, f.salary_currency, f.salary_period,
         f.posted_at, f.discovered_at, f.last_seen_at,
         f.job_url, f.skills, f.category,
         (select count(*) from jobs d where d.duplicate_of = f.id),
         f.rank,
         (select n from counted)
  from filtered f
  order by
    case when p_sort = 'relevance'   then f.rank end desc nulls last,
    case when p_sort = 'salary_desc' then f.salary_max_annual end desc nulls last,
    case when p_sort = 'salary_asc'  then f.salary_min_annual end asc  nulls last,
    coalesce(f.posted_at, f.discovered_at) desc
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- ---------------------------------------------------------------------------
-- Admin dashboard stats
-- ---------------------------------------------------------------------------
create or replace function admin_stats()
returns json language sql stable as $$
  select json_build_object(
    'total_jobs',       (select count(*) from jobs),
    'active_jobs',      (select count(*) from jobs where is_active and duplicate_of is null),
    'duplicate_jobs',   (select count(*) from jobs where duplicate_of is not null),
    'jobs_today',       (select count(*) from jobs where discovered_at >= current_date),
    'sources_total',    (select count(*) from sources),
    'sources_enabled',  (select count(*) from sources where enabled),
    'sources_ok',       (select count(*) from sources where last_status = 'success'),
    'sources_failed',   (select count(*) from sources where last_status in ('failed','partial')),
    'last_collection',  (select max(finished_at) from collection_runs),
    'new_today',        (select coalesce(sum(jobs_new),0) from collection_runs
                          where started_at >= current_date),
    'duplicates_today', (select coalesce(sum(duplicates_found),0) from collection_runs
                          where started_at >= current_date)
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security: public read of jobs/sources, writes via service role only
-- ---------------------------------------------------------------------------
alter table jobs      enable row level security;
alter table companies enable row level security;
alter table sources   enable row level security;

drop policy if exists jobs_public_read on jobs;
create policy jobs_public_read on jobs for select using (true);

drop policy if exists companies_public_read on companies;
create policy companies_public_read on companies for select using (true);

drop policy if exists sources_public_read on sources;
create policy sources_public_read on sources for select using (true);

-- collection_runs / collection_errors stay closed: no policies, service role only.
alter table collection_runs   enable row level security;
alter table collection_errors enable row level security;
