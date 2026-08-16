# Getting Phase 0 to testable

Six steps. Roughly an hour, most of it waiting on provisioning.

## 1 · Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr stripe zod libphonenumber-js posthog-js posthog-node
pnpm add @upstash/ratelimit @upstash/redis          # optional — Postgres fallback if omitted
pnpm add -D vitest @playwright/test supabase tsx
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:rls": "vitest run tests/rls.spec.ts",
"db:reset": "supabase db reset",
"db:types": "supabase gen types typescript --local > src/lib/supabase/types.ts"
```

## 2 · Supabase, locally first

```bash
supabase init && supabase start
supabase db reset          # runs 0001–0007 in order
pnpm db:types              # generates the file every module imports
```

Local first, not a cloud project: `db reset` is destructive and you will run it
twenty times while the policies settle.

## 3 · Storage bucket

```sql
insert into storage.buckets (id, name, public) values ('course-materials','course-materials', false);
```

`public = false` is the entire point. Verify it — a public bucket makes every
signed-URL check in the codebase decorative.

## 4 · Environment

Copy `.env.example` to `.env.local`. For a first pass you can leave Bunny,
Stripe and PostHog blank — but note `src/lib/env.ts` will refuse to boot, which
is deliberate. Either fill in test values or temporarily mark those keys
`.optional()`; do not weaken the check permanently.

## 5 · The three tests that decide whether this works

Everything else is detail.

1. **`pnpm test:rls`** — a level-1 user requests a level-2 lesson by exact ID and
   gets nothing. *If this fails, the paid content is public.*
2. **`stripe listen --forward-to localhost:3000/api/webhooks/stripe`**, complete a
   test checkout, then **replay the same event**. Access is granted once, not
   twice. *If this fails, refunds and retries corrupt entitlements.*
3. **Copy a Bunny playback URL, wait past the TTL, reload.** It must die.
   *If this fails, one shared link is a permanent free account.*

## 6 · What still cannot be tested, and why

| Not testable | Blocked on |
|---|---|
| Real checkout → enrollment | Surpaul's pricing; plans are `published = false` by design |
| Bunny playback | Bunny account not provisioned |
| GHL param passthrough | Jake's embed URL |
| `/login`, `/signup`, `/dashboard` | Phase 2 — not built. Middleware currently redirects to a 404 |
| Any real video | No encoded assets yet |

Stub content covers the rest, which is the point of seeding it.
