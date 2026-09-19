-- ===========================================================================
-- JobFinder — query reference
--
-- HOW TO USE: run these ONE AT A TIME. Highlight a single statement in the
-- Supabase SQL editor and press Run. Pasting the whole file and running it
-- would execute everything and show you only the last result.
--
-- Everything that CHANGES data is commented out. Uncomment deliberately.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. HEALTH CHECK
-- ---------------------------------------------------------------------------

-- Is the schema complete and did seeding work?
-- Expect: tables 5, job_indexes 15, sources 2, functions 3
select
  (select count(*) from information_schema.tables where table_schema = 'public') as tables,
  (select count(*) from pg_indexes where tablename = 'jobs')                     as job_indexes,
  (select count(*) from sources)                                                 as sources,
  (select count(*) from jobs)                                                    as jobs,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and proname in ('jobs_search_document','search_jobs','admin_stats'))      as functions;


-- Operator dashboard stats as one JSON blob (service role only after 0003).
select admin_stats();


-- Confirm migration 0003 locked things down. Expect: f, t, t, f
select has_function_privilege('anon','admin_stats()','execute')      as anon_admin_stats,
       has_column_privilege('anon','sources','name','select')        as anon_source_name,
       has_table_privilege('anon','jobs','select')                   as anon_jobs,
       has_column_privilege('anon','sources','config','select')      as anon_source_config;


-- ---------------------------------------------------------------------------
-- 2. WHAT IS IN YOUR INDEX
-- ---------------------------------------------------------------------------

-- Jobs per source, and how recently each was refreshed.
select s.name,
       count(*)                              as jobs,
       count(*) filter (where j.is_active)   as active,
       max(j.last_seen_at)                   as last_seen
from jobs j
join sources s on s.id = j.source_id
group by s.name
order by jobs desc;


-- Geographic coverage. "(not parsed)" means the location text had no
-- recognisable country — the raw string is still stored.
select coalesce(country, '(not parsed)') as country, count(*)
from jobs where duplicate_of is null
group by country order by count desc;


-- Job categories, as published by the source.
select coalesce(category, '(none)') as category, count(*)
from jobs where duplicate_of is null
group by category order by count desc limit 25;


-- Employment type and work arrangement breakdown.
select employment_type, work_arrangement, count(*)
from jobs where duplicate_of is null
group by 1, 2 order by 3 desc;


-- Most common extracted skills.
select skill, count(*)
from jobs, unnest(skills) as skill
where duplicate_of is null
group by skill order by count desc limit 30;


-- Companies hiring the most.
select company_name, count(*)
from jobs where duplicate_of is null and is_active
group by company_name order by count desc limit 25;


-- ---------------------------------------------------------------------------
-- 3. SEARCHING
-- ---------------------------------------------------------------------------

-- The exact function the website calls. Every parameter is optional.
select title, company_name, source_name, salary_min, posted_at, total_count
from search_jobs(p_query => 'backend engineer', p_limit => 10);


-- Filtered: remote, full-time, posted in the last 7 days.
select title, company_name, location_raw, posted_at
from search_jobs(
  p_arrangements       => array['remote'],
  p_employment_types   => array['full_time'],
  p_posted_within_days => 7,
  p_sort               => 'recent',
  p_limit              => 20);


-- Location search. Matches location_raw, city, region or country.
select title, company_name, location_raw
from search_jobs(p_location => 'Philippines', p_limit => 20);


-- Salary-only, highest first.
select title, company_name, salary_min, salary_max, salary_currency, salary_period
from search_jobs(p_salary_only => true, p_sort => 'salary_desc', p_limit => 20);


-- Raw full-text search, bypassing the function.
-- websearch syntax works: quoted "phrases", and -excluded terms.
select title, company_name
from jobs
where search_vector @@ websearch_to_tsquery('english', 'engineer -senior')
  and duplicate_of is null
limit 20;


-- Fuzzy title matching via the trigram index — tolerates typos.
select title, company_name, round(similarity(title, 'data analyst')::numeric, 3) as score
from jobs
where title % 'data analyst'
order by score desc limit 10;


-- ---------------------------------------------------------------------------
-- 4. DATA QUALITY
-- ---------------------------------------------------------------------------

-- How many jobs have a REAL posting date vs none at all?
-- A high null count for Greenhouse is correct, not a bug: the app refuses to
-- substitute updated_at or discovered_at for a posting date.
select s.name,
       count(*) filter (where j.posted_at is null) as no_posting_date,
       count(*)                                    as total
from jobs j join sources s on s.id = j.source_id
group by s.name;


-- How many publish a salary? Usually a small minority.
select s.name,
       count(*) filter (where j.salary_min is not null) as with_salary,
       count(*)                                         as total
from jobs j join sources s on s.id = j.source_id
group by s.name;


-- Cross-source duplicates that were caught and linked.
select o.title, o.company_name,
       so.name as original_source,
       sd.name as duplicate_source
from jobs d
join jobs o    on o.id  = d.duplicate_of
join sources so on so.id = o.source_id
join sources sd on sd.id = d.source_id;


-- Location strings the parser could not resolve to a country.
-- Useful for improving COUNTRY_ALIASES in src/lib/jobs/normalize.ts.
select location_raw, count(*)
from jobs
where country is null and location_raw is not null
group by location_raw order by count desc limit 20;


-- Stale listings: seen in no run for over a week.
select s.name, count(*) as stale
from jobs j join sources s on s.id = j.source_id
where j.last_seen_at < now() - interval '7 days'
group by s.name;


-- Freshness histogram.
select case
         when coalesce(posted_at, discovered_at) > now() - interval '1 day'  then '1. today'
         when coalesce(posted_at, discovered_at) > now() - interval '3 days' then '2. last 3 days'
         when coalesce(posted_at, discovered_at) > now() - interval '7 days' then '3. last week'
         when coalesce(posted_at, discovered_at) > now() - interval '30 days' then '4. last month'
         else '5. older'
       end as age, count(*)
from jobs where duplicate_of is null
group by age order by age;


-- ---------------------------------------------------------------------------
-- 5. COLLECTION HISTORY
-- ---------------------------------------------------------------------------

-- Recent runs: what succeeded, what failed, how much each found.
select source_id, status, started_at, finished_at,
       jobs_found, jobs_new, jobs_updated, duplicates_found, error_message
from collection_runs
order by started_at desc limit 20;


-- Recent errors, with the HTTP detail needed to diagnose them.
select source_id, http_status, retry_count, url, left(message, 200) as message, occurred_at
from collection_errors
order by occurred_at desc limit 20;


-- Collection volume per day.
select date(started_at) as day, count(*) as runs, sum(jobs_new) as new_jobs
from collection_runs
group by day order by day desc limit 14;


-- Which sources are failing most often?
select source_id, count(*) as errors, max(occurred_at) as latest
from collection_errors
where occurred_at > now() - interval '7 days'
group by source_id order by errors desc;


-- ---------------------------------------------------------------------------
-- 6. SOURCE MANAGEMENT  (read)
-- ---------------------------------------------------------------------------

-- Current configuration and last outcome for every source.
select id, name, enabled, access_method, collect_every_minutes,
       request_delay_ms, max_requests_per_run, max_pages_per_run,
       last_run_at, last_status, left(coalesce(last_error,''), 120) as last_error
from sources order by id;


-- Which Greenhouse boards are configured in the database?
-- (GREENHOUSE_BOARDS in .env is merged with this at run time.)
select config -> 'boards' as boards from sources where id = 'greenhouse';


-- ---------------------------------------------------------------------------
-- 7. SOURCE MANAGEMENT  (write — UNCOMMENT DELIBERATELY)
-- ---------------------------------------------------------------------------

-- Pause a source. Jobs already collected stay searchable; only the scheduler
-- skips it. `npm run collect -- <id>` still runs it when named explicitly.
-- update sources set enabled = false where id = 'arbeitnow';

-- Resume it.
-- update sources set enabled = true where id = 'arbeitnow';

-- Collect fewer pages so a run finishes faster (Arbeitnow ~100 jobs/page).
-- update sources set max_pages_per_run = 3 where id = 'arbeitnow';

-- Each Greenhouse board counts as one page, so this must be >= board count.
-- update sources set max_pages_per_run = 60, max_requests_per_run = 60
--   where id = 'greenhouse';

-- Collect more often (minutes between scheduled runs).
-- update sources set collect_every_minutes = 180 where id = 'arbeitnow';

-- Be gentler on a source: longer pause between requests.
-- update sources set request_delay_ms = 3000 where id = 'arbeitnow';

-- Add Greenhouse boards in the database instead of .env.
-- update sources set config = jsonb_set(config, '{boards}',
--   '["cteph","neweratech","restaurantsupply","whogivesacrap"]'::jsonb)
--   where id = 'greenhouse';

-- Force the next scheduled run to include this source immediately.
-- update sources set last_run_at = null where id = 'greenhouse';


-- ---------------------------------------------------------------------------
-- 8. MAINTENANCE  (write — UNCOMMENT DELIBERATELY)
-- ---------------------------------------------------------------------------

-- Delete one source's jobs and start it over. Companies are left alone.
-- delete from jobs where source_id = 'greenhouse';

-- Clear everything and re-collect from scratch. Sources are kept.
-- truncate jobs, companies, collection_errors, collection_runs restart identity cascade;

-- Trim collection history older than 30 days.
-- delete from collection_errors where occurred_at < now() - interval '30 days';
-- delete from collection_runs   where started_at  < now() - interval '30 days';

-- Bring hidden jobs back (undo an over-eager deactivation).
-- update jobs set is_active = true where source_id = 'arbeitnow';

-- Rebuild every search_vector. Needed only after editing
-- jobs_search_document(), since a generated column does not recompute itself.
-- update jobs set title = title;

-- Reclaim space and refresh planner statistics after a large delete.
-- vacuum analyze jobs;
