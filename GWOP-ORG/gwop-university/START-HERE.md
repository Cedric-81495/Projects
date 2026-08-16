# GWOP University — start here

This is the **complete, merged, runnable project.** Your original site plus the
new platform layer. Verified: `tsc --noEmit` passes with zero errors,
`next build` completes with every route rendering, and no secret appears in the
client bundle.

---

## Run it

```bat
cd C:\gwop
npm install
copy .env.local.example .env.local
npm run dev
```

Open http://localhost:3000

**Put the project at a short path like `C:\gwop`.** Windows caps paths at 260
characters, and `Desktop\GU Website\setup\gwop-university\gwop-university\node_modules\...`
overruns it during `npm install`, failing in ways that look like random
permission errors.

Node 20.9+ required — check with `node -v`. Built and verified on v22.

## What works immediately

`.env.local.example` has placeholder values that pass validation, so the site
runs before any account exists:

| Route | |
|---|---|
| `/` `/830` `/thanks` `/go/[code]` | ✅ your existing pages, untouched |
| `/privacy` `/terms` `/disclosures` `/refunds` `/sms-terms` | ✅ existing |
| `/membership` | ✅ renders — empty state, see below |
| `/login` `/signup` `/reset-password` `/dashboard` | ⏳ render, but need Supabase to do anything |
| `/learn/*` `/account` `/event` | ❌ 404 — Phase 3. The dashboard links to them |

**Not bugs:** `/membership` shows "Pricing is being finalised" because plans are
unpublished pending Surpaul's approval. A new account's dashboard shows all four
levels locked because it has no enrollment. Both are the intended behaviour.

## Make auth work — about 15 minutes

1. Create a project at supabase.com → name it `gwop-dev`
2. **SQL Editor** → paste each file from `supabase/migrations/` in order,
   `0001` through `0007`, running each one
3. **Authentication → URL Configuration** → add redirect URL
   `http://localhost:3000/auth/callback`
4. **Storage** → new bucket `course-materials`, **Public OFF**. Verify this —
   a public bucket makes every signed-URL check in the codebase decorative
5. Paste your Project URL and both keys into `.env.local`
   (Project Settings → API)
6. Generate types:
   ```bat
   npx supabase login
   npx supabase link --project-ref YOUR_REF
   npm run db:types
   ```
7. Restart `npm run dev`

Sign up, confirm the email, and you land on `/dashboard`.

To see it populated, grant yourself a level in the SQL Editor:

```sql
insert into public.enrollments (user_id, level, source, status)
select id, 3, 'manual_grant', 'active'
from auth.users where email = 'you@example.com';
```

Levels 1–3 unlock, Senior stays locked. That is cumulative access working.

## Then

| Read | For |
|---|---|
| `ARCHITECTURE.md` | The full design review — schema, security, risks, blockers |
| `docs/SETUP-KEYS.md` | Every credential, where to get it, which env var |
| `docs/RUNNING-AND-TESTING.md` | Stripe test cards and the four tests that matter |
| `docs/RUN-LOCALLY.md` | The seven bugs found while verifying this build |
| `CLAUDE.md` | Your existing project constitution — **still authoritative** |

## ⚠️ Before you go further

`CLAUDE.md` §3 states no database, no auth and no API routes before Aug 30, with
a build freeze on Aug 27. This package contains all three. That conflict is real
and **Felicia has not ruled on it.**

Recommended: run everything here on a `develop` branch against a separate
Supabase project, and ship nothing new to production before the event except the
extracted `GHLLeadForm` component. The Aug 30 surface then changes by one tested
component swap rather than riding on top of a brand-new auth system.

The item with a hard date is still the domain — Aug 23 QR lock, and no tracker
row owns it.
