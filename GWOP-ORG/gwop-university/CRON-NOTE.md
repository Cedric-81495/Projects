# Scheduled jobs

**Updated 2026-08-27** — Felicia approved Vercel Pro, so the retry job is now
scheduled. This note previously explained why it wasn't.

## What runs

| Path | Schedule | What it does |
|---|---|---|
| `/api/v1/cron/expire` | `0 7 * * *` — daily | Expires stale enrolments |
| `/api/v1/cron/lead-sync` | `0 8 * * *` — daily ⚠️ | Retries leads and assessments that failed to reach GHL |

⚠️ **The retry job is on a daily schedule because the plan is still Hobby.**
Hobby allows one cron per day and rejects any sub-daily expression — not as a
build error, but at config validation, so the deployment never appears in the
list at all. That is what silently blocked three pushes on 27 August.

**Change to `*/2 * * * *` the moment Pro is active**, and confirm the deployment
goes through afterwards.

## Why two minutes

A lead that fails to forward at 2pm should not wait until the next morning. On
the free plan only one job a day was allowed, and a sub-daily expression failed
the entire deployment — which is what broke the builds on 19 August.

The retry matters less than it did, since the `waitUntil` fix means the forward
now actually completes rather than being discarded mid-flight. But it is the
backstop for a genuine network failure during the event, and a booth on venue
cellular is exactly where that happens.

## Running either by hand

```bash
curl -X POST "https://go.thegwopblueprint.com/api/v1/cron/lead-sync" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Both routes are guarded by `CRON_SECRET`, compared in constant time.

## Lead export

Not scheduled, deliberately — a timed job writing personal data somewhere is a
liability nobody asked for. Run it when it is wanted:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://go.thegwopblueprint.com/api/v1/export/leads?event=egc-2026-08-30" \
  -o gwop-leads.csv
```

Every lead plus their assessment answers, including the ones who did not finish.
Drop the `?event=` filter to get everything, test rows included.

**Do this at the end of event day.** Four hundred leads are the entire value of
the activation, and a file someone keeps removes the dependency on any single
platform.

⚠️ One response contains every attendee's name, phone and email — the most
sensitive endpoint in the project. Do not put the URL anywhere it could be read,
and store the file somewhere appropriate.
