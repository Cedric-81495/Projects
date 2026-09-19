# Adding a job source

## 1. Check what the site actually publishes

```bash
npm run new-source -- --url "https://example.com/jobs?q=developer"
```

The probe reads robots.txt, then inspects the page for declared feeds, JSON
endpoints the page itself references, `schema.org/JobPosting` JSON-LD, and
repeated listing markup. It reports what it found and recommends an access
method, in this order:

1. **Official API** — use it if one exists and is free
2. **RSS/Atom feed** — lightest option after an API
3. **Public JSON endpoint** — only endpoints the page itself loads
4. **Structured data** — JSON-LD / schema.org JobPosting
5. **Public HTML** — parse with Cheerio, last resort

The probe never guesses URLs from common path patterns. If it reports
`unsupported`, it writes no connector — record the source with
`access_method = 'unsupported'`, leave it disabled, and move on.

## 2. Confirm the response by hand

Before writing a parser, look at a real response and note the exact field
names, whether HTML is entity-escaped, and whether there is a genuine posting
date. Add what you find to `docs/SOURCES.md`.

## 3. Implement the connector

The generator scaffolds `src/lib/sources/<id>/{index,types,parser}.ts`.

- **`types.ts`** — a zod schema for the source's own response. Use
  `safeParse()` in `discoverJobs` so a format change is caught and logged
  rather than stored.
- **`parser.ts`** — field extraction into `ParsedJob`. Site-specific regexes
  and selectors belong here and nowhere else.
- **`index.ts`** — the connector. Paginate inside `ctx.session.hasPageBudget()`
  and call `ctx.session.countPage()` per page.

Rules that matter more than they look:

- Leave a field **null** rather than guessing. That applies hardest to
  `postedAtRaw` — an "updated" or "scraped" timestamp is not a posting date.
- Fetch through `ctx.session`, never bare `fetch()`.
- Prefix `externalJobId` when one connector serves several boards or regions
  (`clickhouse:4567890`, `de:some-slug`) so ids cannot collide.
- Catch per-item failures so one bad record does not abort the run.

## 4. Register and seed it

```ts
// src/lib/sources/registry.ts
export const CONNECTORS = [
  arbeitnowConnector as JobSourceConnector<never>,
  greenhouseConnector as JobSourceConnector<never>,
  exampleConnector as JobSourceConnector<never>,   // add here
];
```

```sql
insert into sources (id, name, homepage, access_method, enabled,
                     request_delay_ms, max_pages_per_run, collect_every_minutes,
                     respect_robots, config, notes)
values ('example', 'Example Jobs', 'https://example.com', 'json_endpoint', false,
        2000, 5, 720, true, '{}'::jsonb, 'Public endpoint the listing page loads.');
```

Start disabled, with a conservative delay and a small page budget.

## 5. Test it

```bash
npm run collect -- example
```

Check the run summary, then `collection_errors` for anything logged, then
search for a job you know exists. Enable it once it is clean.

`GET /api/admin/sources` flags both mistakes worth catching: a `sources` row
with no connector registered, and a registered connector with no row.

## What not to do

A site that requires a login, serves a CAPTCHA, puts listings behind a paywall,
or runs an anti-bot system is **unsupported**. Record it as such. Do not work
around it, and do not reach for a paid scraping or proxy service to get past
it — a source that costs money or needs circumvention is not a source this
project takes.
