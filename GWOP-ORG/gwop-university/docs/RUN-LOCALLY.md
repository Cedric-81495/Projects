# Running locally

**This build is verified.** Merged into your repo, it passes `tsc --noEmit` with
zero errors and completes `next build` with every route rendering. The secret
scan over `.next/static/` comes back empty.

---

## Fastest path — no Docker

`supabase start` needs Docker. If you don't have it, use a **cloud dev project**
instead; everything works identically.

```bash
# 1 · dependencies (see package.deps.json for the exact versions verified)
npm install @supabase/supabase-js @supabase/ssr @upstash/ratelimit @upstash/redis \
            libphonenumber-js posthog-js posthog-node server-only stripe zod
npm install -D tsx vitest supabase

# 2 · create a project at supabase.com/dashboard  → "gwop-dev"
#     SQL Editor → paste each migration 0001…0007 in order → Run

# 3 · types
npx supabase login
npx supabase link --project-ref <your-ref>
npx supabase gen types typescript --linked > src/lib/supabase/types.ts

# 4 · env
cp .env.example .env.local     # fill in the Supabase values + CRON_SECRET

# 5 · go
npm run dev                     # http://localhost:3000
```

## Placeholder values, to browse before the accounts exist

Stripe and Bunny are validated as required so a production deploy cannot boot
half-configured. To browse the UI before those accounts exist, the build was
verified with exactly these — they pass validation and are obviously fake:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
BUNNY_LIBRARY_ID=0
BUNNY_API_KEY=placeholder-bunny-key
BUNNY_TOKEN_SECURITY_KEY=placeholder-bunny-token-key
BUNNY_CDN_HOSTNAME=vz-placeholder.b-cdn.net
CRON_SECRET=placeholder-cron-secret-at-least-32-chars-long
```

Pages render. Any action that actually calls Stripe or Bunny fails, which is
correct — swap in real test keys when you reach Phase 4.

## What you'll see

| Route | |
|---|---|
| `/` `/830` `/thanks` | your existing pages, untouched |
| `/signup` `/login` `/reset-password` | new — work as soon as Supabase is connected |
| `/dashboard` | four levels; empty state until you grant an enrollment |
| `/membership` | plan cards; **empty state** until plans are published — that is correct |
| `/learn/*` `/account` `/event` | 404 — Phase 3+. The dashboard links to them |

To populate the dashboard, grant yourself a level in the SQL Editor:

```sql
insert into public.enrollments (user_id, level, source, status)
select id, 3, 'manual_grant', 'active' from auth.users where email = 'you@example.test';
```

Levels 1–3 unlock, Senior stays locked — cumulative access, working.

## Real-device check

```bash
npm run build && npm start -- -H 0.0.0.0
```

Open the Network URL on a phone on the same wifi. Worth doing early: the audit
in your repo found seven layout bugs that all looked fine in code review.

---

## Seven bugs found while verifying this build

Fixed and already in the zip. Listed because two of them are architectural.

| | Bug | Why it mattered |
|---|---|---|
| 1 | `cookies()` is async in Next 15 | `createServerSupabase()` is now `async`; **every call site must `await`** |
| 2 | `publicEnv` lived in a `server-only` module | Client components importing it broke the build. Split into `env.public.ts`. The build failure was the correct outcome — it is the guard that keeps the service key out of the browser |
| 3 | Stripe `apiVersion` hardcoded | Mismatched the installed SDK. Now the SDK pins its own |
| 4 | `subscription.current_period_end` moved onto items | Would have written `null` and expired subscribers' access immediately |
| 5 | Nested Supabase select returns an array | The Bunny video join needed normalising |
| 6 | Route handler context typed optional | Next 15 requires it; generated route types failed |
| 7 | Malformed `LimitName` union | Syntax error from an earlier rename |
