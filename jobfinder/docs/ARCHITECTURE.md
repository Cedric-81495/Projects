# Architecture

The rule the whole design serves:

    New job source -> new connector -> same normalized schema -> same search

Adding a site means adding one folder under `src/lib/sources/` and one row in
the `sources` table. Search, filters, sorting, dedupe, storage and the UI are
untouched.

## Collection is decoupled from search

Sites are never crawled while someone is searching:

    scheduled trigger
      -> connector.discoverJobs()      list what the source has
      -> connector.fetchJob()          get one job (no-op for API sources)
      -> connector.parseJob()          extract fields, site-specific
      -> connector.normalizeJob()      map to the shared vocabulary
      -> zod validation                reject malformed records
      -> deduplicate                   within the batch, then against the DB
      -> Supabase
      -> user search                   reads only the database

Searches therefore hit one indexed table and nothing else, and a slow or broken
site affects freshness rather than availability.

## The connector contract

`src/lib/sources/types.ts` defines `JobSourceConnector`:

| Method | Does |
|---|---|
| `discoverJobs(ctx)` | Returns `JobRef[]`. Handles pagination inside the page budget. |
| `fetchJob(ref, ctx)` | Returns the raw payload. API sources use `passthroughFetch`. |
| `parseJob(raw, ctx)` | Site-specific field extraction into `ParsedJob`. |
| `normalizeJob(parsed, ctx)` | Usually delegates to the shared `normalizeParsedJob()`. |

Splitting parse from normalize is what keeps connectors small. Site-specific
regexes and selectors live in the connector; the shared vocabulary — employment
types, work arrangements, locations, salaries, skills — lives in
`src/lib/jobs/` and is written once.

Connectors never call `fetch()`. They go through `CrawlSession`, which enforces
the request delay, the per-run request and page budgets, retries with
exponential backoff and jitter, `Retry-After`, and robots.txt.

The two shipped connectors are deliberately different shapes — Arbeitnow is
paginated and single-tenant, Greenhouse is unpaginated and multi-tenant — which
is what demonstrates the interface actually holds.

## Deduplication

Four stages, cheapest and most certain first:

1. `source_id + external_job_id` — the same posting, collected again
2. `canonical_url` — tracking params, `www.` and trailing slashes removed
3. `fingerprint` — sha256 of company slug + core title + core location, where
   "core title" drops seniority words and gendered suffixes, so
   `Senior Product Engineer (m/w/d)` matches `Product Engineer II`
4. anything left is new

Duplicates are **stored, not discarded**. The row carries its own source and
points at the original through `duplicate_of`. Search excludes them; the job
page lists them under "Also listed on". That satisfies both halves of the
requirement: no repeated results, no lost provenance.

## Freshness

Three separate timestamps, never conflated:

- `posted_at` — what the source published. **Null when it published none.**
- `discovered_at` — when JobFinder first saw it
- `last_seen_at` — the most recent run that still found it

`formatFreshness()` renders "Posted 2 days ago" only for a real posting date.
Otherwise it says "Found 2 days ago · no posting date given". Nothing backfills
`posted_at`, and Greenhouse's `updated_at` is specifically not treated as one.

Listings a source stops returning are marked `is_active = false` after a grace
period rather than deleted, so closed roles leave search without losing history.

## Search

All search goes through the `search_jobs` SQL function, so filtering and
ranking sit next to the indexes that serve them. It uses
`websearch_to_tsquery` against a stored, weighted `tsvector` — title weighted
above company and skills, above location, above description — with `ts_rank`
for relevance sort. `pg_trgm` indexes back the `ilike` location matching.

One deliberate behaviour: **a job with no salary is never filtered out** by a
salary range. Most listings publish no salary, and excluding them by default
would hide most of the index. The "only jobs that publish a salary" checkbox is
the opt-in.

## Error handling

A failing source cannot affect another. `runSource()` catches everything,
records it against the run and the source, and returns a summary:

- `success` — completed cleanly
- `partial` — did useful work but hit a budget, a bad record, or a write error
- `failed` — produced nothing

Every failure writes to `collection_errors` with the URL, HTTP status, retry
count, message and stack. The worker exits non-zero only when *every* source
failed, so a scheduler alerts on a real outage and tolerates one flaky site.

## Scheduling on free tiers

Vercel Hobby allows one cron per day and caps functions at 60 seconds, so it
cannot be the only mechanism. The design uses both:

- **`/api/cron/collect`** — the daily Vercel cron in `vercel.json`. Runs only
  sources whose `collect_every_minutes` window has elapsed, and per-source
  budgets are small enough to finish inside 60 s.
- **`.github/workflows/collect.yml`** — the real worker, every six hours, with
  no function timeout. This is the path to use for anything heavier.

Both call the same `runDueSources()`. The collector is plain Node with no
Next.js dependency, so moving it to Fly, Railway, a Raspberry Pi or a cron on
any box is a change of trigger, not of code.

## Access boundaries

Enforced in code, not just documented:

- `CrawlSession` fetches and parses robots.txt, and **fails closed** for
  robots-respecting sources when robots.txt cannot be read.
- Per-source `request_delay_ms`, `max_requests_per_run`, `max_pages_per_run`
  and `retry_limit` are columns, not constants.
- `CRAWLER_USER_AGENT` identifies the bot and carries a contact URL.
- The generator writes no connector when it finds no permitted access method.

Nothing here logs in, solves a CAPTCHA, passes a paywall, or works around an
anti-bot system. A site that does not permit automated access is recorded as
`unsupported` and left disabled.

## Security

- The anon key is used for all reads; RLS allows public select on
  `jobs`, `companies` and `sources` only. `collection_runs` and
  `collection_errors` have RLS on and no policy, so they are service-role only.
- The service role key is used only in server code — the collector and the
  admin and cron routes. It is never imported into a client component.
- `/api/admin/*` and `/api/cron/*` compare tokens in constant time.
- Every external record passes a zod schema before it reaches the database.
- `src/lib/env.ts` validates configuration at startup rather than failing
  cryptically later.
