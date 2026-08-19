# ⚠ CRON NOT SCHEDULED — action required before production

**Status: TESTING. This is a deliberate, temporary state.**
**Owner: Cedric. Deadline: before Aug 30.**

---

## What is missing

`/api/v1/cron/lead-sync` **exists and works**, but it is **not scheduled**. It
has been removed from `vercel.json`.

## Why

Vercel **Hobby plans allow cron jobs once per day only**. Any more frequent
expression is rejected at deploy time and **fails the entire deployment** — not
just the cron. That is what blocked the 2026-08-19 builds.

A once-daily retry is useless at a booth. If a lead fails to forward at 2pm it
should not wait until 4am. So rather than schedule something that does not help,
the schedule is removed and the decision deferred.

## What still works without it

Nothing is lost. The retry path is intact:

- A lead is saved to Supabase **before** any forward is attempted
- If the forward fails, the row stays `sync_status = 'pending'` with the reason
  in `last_error`
- The route drains those rows whenever it is called

The only thing missing is **automatic** calling.

## Manual trigger

```
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<domain>/api/v1/cron/lead-sync
```

Returns `{ processed, synced, stillPending, failed }`.

Check the backlog at any time:

```sql
select sync_status, count(*) from public.leads group by sync_status;
```

---

## BEFORE AUG 30 — pick one

**Option A — upgrade to Vercel Pro.** Allows per-minute crons. Restore to
`vercel.json`:

```json
{ "path": "/api/v1/cron/lead-sync", "schedule": "*/2 * * * *" }
```

Two minutes is the right interval: a lead that fails at the table reaches Jake
before the attendee has left the venue.

**Option B — assign a person.** Someone on the booth team runs the manual
trigger hourly, or watches the signup count and runs it if the number looks
wrong. Free, but depends on somebody remembering during a busy event.

**Option C — accept it.** Leads still save and are never lost; they simply reach
Jake later. Acceptable only if nobody needs same-day follow-up, which
contradicts the nurture plan's immediate-SMS design.

**Recommendation: A.** One month of Pro costs less than one lost lead, and it is
the only option that does not depend on a person remembering something during a
five-hour event.

---

## Do NOT do this

Do not re-add a sub-daily cron while on Hobby. It does not warn or degrade — it
fails the whole deployment, and the site keeps serving the previous build. That
failure mode is silent from the outside: the deploy goes red, the old version
stays up, and everything looks fine until someone notices the new form is
missing.
