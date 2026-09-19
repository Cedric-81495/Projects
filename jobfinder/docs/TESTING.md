# Testing JobFinder

Test in stages. Stage 1 needs nothing installed but Node — no Supabase
account, no network. Only move on when the stage before it is green.

```bash
npm install
npm run verify        # stage 1: 37 checks, offline
```

## Stage 1 — the pipeline, offline

`npm run verify` runs captured live API responses through the whole chain:
parse -> normalize -> validate -> deduplicate. It asserts the things that are
easy to get quietly wrong:

- Greenhouse's entity-escaped HTML is decoded, not stored as literal `&lt;p&gt;`
- a job with no posting date gets `null`, and `updated_at` is never used as one
- `Senior Backend Engineer (m/w/d)` and `Backend Engineer II` at the same
  company produce the same fingerprint, so the duplicate is caught
- tracking params, `www.` and trailing slashes do not defeat URL matching
- "Competitive salary" yields no salary rather than an invented one
- a bare country is not recorded as a city
- robots.txt precedence: a more specific `Allow` beats a broader `Disallow`

Non-zero exit on failure, so it drops straight into CI.

## Stage 2 — database

Create a free Supabase project, then open the SQL editor and run
`supabase/migrations/0001_init.sql` followed by `0002_seed_sources.sql`.
(Or `supabase db push` with the CLI.)

Both files are idempotent — re-running them is safe, which matters because the
SQL editor makes partial runs easy. After 0001 you should have five tables,
15 indexes on `jobs`, and three functions: `jobs_search_document`,
`search_jobs`, `admin_stats`.

One thing to know if you edit the search weighting later: `search_vector` is a
generated column, so it can only call IMMUTABLE functions. That is why the
expression lives in `jobs_search_document()` rather than inline —
`array_to_string` is STABLE and Postgres rejects it in a generated column with
`ERROR: 42P17: generation expression is not immutable`. Changing the function
does not recompute stored rows; re-run the collector to refresh them.

Copy the config. **Use `.env`, not `.env.local`** — Next.js reads both, but the
collector and verifier are plain Node and read `.env` only.

```bash
cp .env.example .env
```

Fill in the Supabase URL, anon key and service role key from
Project settings -> API. Generate the two tokens:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then:

```bash
npm run verify -- --db
```

This confirms the env vars parse, all three tables are reachable, the seed rows
landed, and both RPCs (`search_jobs`, `admin_stats`) respond. It prints the
current job count, which should be 0.

## Stage 3 — live sources

```bash
GREENHOUSE_BOARDS=vercel,linear npm run verify -- --live
```

Calls the real APIs and checks the responses still match what the connectors
expect. This is the check to run on a schedule: it is how you find out a source
changed its format before bad data reaches the database.

## Stage 4 — a real collection run

```bash
npm run collect -- --all
```

Expect a line per source:

```
SUCCESS   arbeitnow       found 100  new 100  updated 0  dupes 0  invalid 0  2 req  4s
SUCCESS   greenhouse      found 87   new 85   updated 0  dupes 2  invalid 0  2 req  3s
```

Run it a second time. The numbers should invert — `new 0`, `updated ~100` —
which proves deduplication stage 1 works against the database, not just in
memory. If `new` stays high on the second run, external IDs are unstable.

Things worth checking in the Supabase table editor:

```sql
-- posting dates must never be back-filled
select source_id, count(*) filter (where posted_at is null) as no_date, count(*)
from jobs group by source_id;

-- cross-source duplicates, if any
select j.title, j.company_name, s.name as source
from jobs j join sources s on s.id = j.source_id
where j.duplicate_of is not null;

-- full-text search directly
select title, company_name from jobs
where search_vector @@ websearch_to_tsquery('english', 'backend engineer') limit 5;
```

## Stage 5 — the app

```bash
npm run build   # catches route and type errors the dev server tolerates
npm run dev     # http://localhost:3000
```

A clean build lists all nine routes. If the CSS fails to evaluate, check that
`@tailwindcss/postcss` is installed and that `postcss.config.mjs` names it —
Tailwind v4 cannot be used as a PostCSS plugin directly.

Walk the MVP criteria in order:

1. Search "engineer" from the homepage — results appear on `/jobs`
2. Add a location — result count drops
3. Job type -> Full-time; Work arrangement -> Remote
4. Date posted -> Last 7 days
5. Sort -> Salary: highest, then confirm jobs *without* a salary are still in
   the list. They should be. Only the "only jobs that publish a salary"
   checkbox removes them.
6. Open a job — check the detail page shows the source name
7. Click **Apply** — it must open the original posting on the source site
8. Find a job with no posting date: it should read "Found N days ago · no
   posting date given", never "Posted today"

## Stage 6 — API and admin

```bash
curl "http://localhost:3000/api/jobs?q=engineer&type=full_time&sort=recent" | head -c 400

curl -H "x-admin-token: $ADMIN_TOKEN" http://localhost:3000/api/admin/sources
curl -X POST -H "x-admin-token: $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/sources/arbeitnow/run

curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/collect
```

Check authentication actually bites. All of these must be rejected:

```bash
curl -i http://localhost:3000/api/admin/sources                      # 401
curl -i -H "x-admin-token: wrong" http://localhost:3000/api/admin/sources   # 401
curl -i -X POST -H "content-type: application/json" \
  -d '{"password":"wrong"}' http://localhost:3000/api/admin/login    # 401
```

Visit `/admin` in a private window: you must get a password form, not the
dashboard. Sign in, then use **Run now** and **Disable**. A disabled source
must be skipped by the next collection run. **Sign out** and reload — the
form should come back.

Confirm the database side of the gate too, using the anon key:

```sql
-- as anon, both of these must fail after migration 0003
select admin_stats();
select config from sources;
```

## Stage 7 — failure handling

This is the part most worth testing deliberately, because it is what keeps one
broken site from taking down the rest.

**A source that breaks.** Point one at a dead endpoint:

```sql
update sources
set config = '{"variants":[{"key":"de","endpoint":"https://example.invalid/api"}]}'::jsonb
where id = 'arbeitnow';
```

```bash
npm run collect -- --all
```

Arbeitnow should report `FAILED`, Greenhouse should still report `SUCCESS`, and
the process should exit 0 because not everything failed. Check the error was
recorded, then put the config back:

```sql
select source_id, http_status, retry_count, message
from collection_errors order by occurred_at desc limit 5;
```

**Budgets.** Set `max_pages_per_run = 1` on Arbeitnow and re-run. The status
should be `partial`, not `failed` — hitting a budget is a clean stop, not an
error.

**Empty state.** Search for `zzzznotarealjob`. You should get the empty-state
copy, not a crash or a blank page.

## Stage 8 — the generator

```bash
npm run new-source -- --url "https://www.arbeitnow.com/jobs"
```

It should report what it found and recommend an access method. Now point it at
a site that disallows crawling:

```bash
npm run new-source -- --url "https://remotive.com/remote-jobs"
```

It must refuse to scaffold anything and tell you to record the source as
unsupported. If it ever writes a connector for a disallowed site, that is a bug.

## Stage 9 — deploy

Import to Vercel, set the environment variables, deploy, then hit the cron
endpoint on the deployed URL with the `CRON_SECRET` Vercel generated. Confirm
it finishes inside the 60-second function limit. If it does not, lower
`max_pages_per_run` and let the GitHub Actions worker do the heavy runs
instead.

Trigger the workflow manually from the Actions tab to confirm the secrets are
right before trusting the schedule.

## Before trusting a deployment

- [ ] `npm run verify -- --all` passes
- [ ] Second collection run shows `new 0`, `updated N`
- [ ] Unauthenticated `/api/admin/sources` returns 401
- [ ] `.env` is not committed (`git status --porcelain .env` prints nothing)
- [ ] A failing source leaves the others `SUCCESS`
- [ ] Apply buttons open the original posting, not a JobFinder page
- [ ] Jobs with no salary still appear under a salary sort
