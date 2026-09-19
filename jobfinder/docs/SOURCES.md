# Job sources

Every source here was checked against its live endpoint before a connector was
written. Nothing in this table is inferred from documentation alone.

## Service and cost inventory

| Service | Free tier | Purpose | Limitations |
|---|---|---|---|
| Supabase (Postgres) | 500 MB database, 2 projects, paused after 7 days idle | Jobs, sources, collection history, full-text search | Free projects pause without activity; a daily collection run keeps one awake. No point-in-time recovery. |
| Vercel (Hobby) | 100 GB bandwidth/month, 1 cron job/day, 60 s function limit | Hosting the Next.js app and one daily collection trigger | One cron per day is not enough for fresh listings on its own — see Scheduling below. |
| GitHub Actions | 2,000 min/month private, unlimited on public repos | Scheduled collection worker, no function timeout | Scheduled runs can be delayed at peak times, and are disabled after 60 days of repo inactivity. |
| Arbeitnow API | Unlimited, no key | Job source | No salary field. Europe/UK coverage only. Attribution required. |
| Greenhouse Job Board API | Unlimited, no key | Job source | Only boards you list. No employment-type field. Salary only when the employer exposes it. |

No paid API, proxy, CAPTCHA service or scraping platform is used anywhere.

## Connected sources

### Arbeitnow — `official_api`

- Endpoint: `https://www.arbeitnow.com/api/job-board-api` (and `.co.uk` for the UK board)
- Auth: none
- Pagination: `?page=N`, with `links.next` and `meta.last_page` in the response
- Verified fields: `slug`, `company_name`, `title`, `description` (HTML),
  `remote` (boolean), `url`, `tags[]`, `job_types[]`, `location`,
  `created_at` (unix seconds)

Documented as a free public API at
`https://www.arbeitnow.com/blog/job-board-api`. It republishes ATS feeds
(Greenhouse, SmartRecruiters, Join.com, Teamtailor, Recruitee, Comeet) in one
consistent shape, so a single connector reaches many employers.

**Attribution is required** and is set on the source row, so every job card and
detail page credits Arbeitnow and links back to the original posting.

**No salary field.** A minority of listings put a `Compensation:` line in the
description; the connector reads that and nothing else. Everything else is
stored with a null salary rather than an estimate.

### Greenhouse Job Boards — `official_api`

- Endpoint: `https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true`
- Auth: none for reads. This is the same endpoint Greenhouse serves employers'
  own careers pages from; only the application POST endpoint needs a key.
- Pagination: none — one request returns a whole board
- Verified fields: `id`, `title`, `absolute_url`, `updated_at`,
  `first_published`, `location.name`, `offices[]`, `departments[]`,
  `content` (HTML, entity-escaped), `metadata[]`

Boards are **configured, not discovered**. Add tokens to `sources.config.boards`
or the `GREENHOUSE_BOARDS` environment variable. The token is the path segment
in `boards.greenhouse.io/<token>`.

Two quirks the connector handles: `content` arrives HTML-entity-escaped and has
to be decoded before parsing, and there is no remote flag — the signal is in the
office names (`Remote - EU`), which `remoteHintFrom()` reads.

`updated_at` is an edit timestamp, not a posting date, so it is **not** used as
one. Jobs without `first_published` are stored with `posted_at = null` and the
UI says when JobFinder found them instead.

## Reviewed and not connected

### Remotive — `unsupported`

Their API is free and keyless, but two things rule it out for an aggregator:

1. `remotive.com/robots.txt` disallows automated access for our user agent.
2. Their API terms ask developers not to submit Remotive jobs to third-party
   job sites, and name aggregators specifically as the thing they are
   protecting against.

Per the access rules, the correct response is to mark the source unsupported
rather than look for a way around it. If you want it, contact them at
`hello@remotive.com` and ask permission — do not enable it without one.

### Indeed, LinkedIn, Glassdoor — `unsupported`

The Indeed API is no longer issued to new publishers. LinkedIn and Glassdoor
listings sit behind anti-bot systems and terms that forbid automated
collection. Getting listings from any of them would mean defeating an access
control, which this project does not do. Leave them out.

## Good candidates to add next

All are public ATS endpoints of the same shape as Greenhouse, so each is a
short connector built on the same interface. Verify each endpoint with
`npm run new-source -- --url ...` before writing code.

- **Lever** — `api.lever.co/v0/postings/{company}?mode=json`
- **Ashby** — public job board API per company
- **Workable** — public account endpoints
- **SmartRecruiters** — public postings API
- **Recruitee** — public offers API
- **USAJOBS** — free API key, US federal roles
- **Hacker News "Who is hiring"** — via the free Algolia search API
