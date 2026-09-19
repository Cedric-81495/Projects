# JobFinder

A free job aggregator. It collects publicly available listings from permitted
sources on a schedule, normalizes them into one schema, removes duplicates, and
puts them behind a single search — then sends every applicant to the original
posting.

Built for Next.js 16, React 19 and Tailwind v4.

Two real sources ship working, both free and keyless: **Arbeitnow** and the
**Greenhouse Job Board API**. Neither the app nor the collector depends on any
paid API, proxy or scraping service.

## What is built

- Postgres schema with full-text search, trigram indexes and RLS
  (`supabase/migrations/`)
- Search, filters, sorting and pagination through one `search_jobs` SQL function
- Modular connector architecture with two live connectors of deliberately
  different shapes
- Four-stage deduplication that keeps duplicates as provenance instead of
  dropping them
- Scheduled collection with per-source rate limits, retries with exponential
  backoff, robots.txt handling and per-source error isolation
- Homepage, results page, job detail page, admin dashboard
- A connector generator that probes a site and refuses to scaffold one when no
  permitted access method exists

## Quick start

```bash
npm install
npm run verify                 # 37 offline checks — no Supabase needed yet
cp .env.example .env           # fill in Supabase URL + keys, set the two tokens
```

Use `.env`, not `.env.local`: Next.js reads both, but the collector and the
verifier are plain Node and read `.env` only.

Apply the migrations — Supabase SQL editor, or:

```bash
supabase db push
```

Collect and run:

```bash
npm run verify -- --all        # check the schema, RPCs and live source APIs
npm run collect -- --all       # first collection
npm run dev                    # http://localhost:3000
```

Full test plan, including failure-handling checks: `docs/TESTING.md`.

Add Greenhouse boards (the path segment in `boards.greenhouse.io/<token>`):

```bash
GREENHOUSE_BOARDS=vercel,anthropic,linear
```

## Project layout

```
supabase/migrations/     schema, search_jobs(), admin_stats(), RLS, seed rows
src/app/                 pages and route handlers
  jobs/                  results + detail
  admin/                 source dashboard
  api/                   /jobs, /admin/sources, /cron/collect
src/components/          search, filters, job cards, UI primitives
src/lib/
  sources/               connectors — one folder per site + registry
  jobs/                  normalize, salary, fingerprint, deduplicate, schema
  scraping/              CrawlSession (rate limit, retry, budgets), robots.txt
  collect/               the run orchestrator
  db/                    Supabase clients and persistence
  search/                query builder over search_jobs()
scripts/                 collect.ts (worker), new-source.ts (generator),
                         verify.ts (staged self-test)
docs/                    SOURCES, ARCHITECTURE, ADDING-A-SOURCE, TESTING,
                         QUERIES.sql (ready-made SQL for the Supabase editor)
```

## Adding a source

```bash
npm run new-source -- --url "https://example.com/careers"
```

See `docs/ADDING-A-SOURCE.md`. The short version: implement one
`JobSourceConnector`, add it to the registry, insert a `sources` row. Nothing in
search, filtering, storage or the UI changes.

## Scheduling

Vercel Hobby allows one cron per day and caps functions at 60 seconds, so the
daily `vercel.json` cron is a backstop, not the whole mechanism. The real
worker is `.github/workflows/collect.yml`, running every six hours with no
timeout. Both call the same code, and `scripts/collect.ts` has no Next.js
dependency, so it will run anywhere.

## Access policy

Only public, permitted endpoints. Nothing logs in, defeats a CAPTCHA, passes a
paywall, or evades an anti-bot system. Sources that do not permit automated
access are recorded as `unsupported` and left disabled — Remotive is in the
repo as a worked example of that decision, with the reasoning in
`docs/SOURCES.md`.

## Deploy

1. Create a Supabase project, apply both migrations
2. Import the repo into Vercel, set the environment variables from
   `.env.example`
3. `vercel.json` registers the daily cron; Vercel supplies `CRON_SECRET`
4. Add the same secrets to GitHub Actions for the six-hourly worker

## Status against the MVP criteria

Working end to end: search, filters, sorting, Supabase storage, salary
filtering where data exists, employment-type and arrangement filters, source
attribution, links to original postings, two live sources, duplicate handling,
error logging, Vercel deployability, and no paid dependency.

Not yet built: user accounts, saved searches and job alerts. The schema has no
opinion about them, so they are additive.

Verified so far by typecheck and by `npm run verify` — 37 assertions over the
parse → normalize → validate → dedupe pipeline, using captured live responses
from both APIs. The Supabase round trip needs a real project to exercise;
`npm run verify -- --db` checks it once you have one.
