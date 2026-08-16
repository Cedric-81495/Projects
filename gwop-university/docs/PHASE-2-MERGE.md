# Phase 2 merge — auth + portal

## What landed

| File | What it is |
|---|---|
| `lib/auth/actions.ts` | Server Actions: sign in, sign up, request reset, update password, sign out |
| `lib/auth/redirect.ts` | `safeNext()` — open-redirect guard for `?next=` |
| `lib/security/turnstile.ts` | Bot verification, fails closed |
| `app/(auth)/*` | `/login` `/signup` `/reset-password` `/update-password` |
| `app/auth/callback` | Email link → session exchange |
| `app/auth/signout` | POST-only sign out |
| `app/(portal)/layout.tsx` | One server guard covering every portal route |
| `app/(portal)/dashboard` | Four-level pathway with real progress |
| `components/portal/PortalChrome.tsx` | Portal shell, zero client JS |
| `app/ingest/[...path]` | PostHog reverse proxy |
| `styles/auth.css` · `styles/portal.css` | Prefixed `.au*` / `.po*`, tokens from `:root` |

This closes the gap flagged last round: `middleware.ts` redirected to a `/login`
that did not exist.

## Merge steps

1. Copy `src/` and `supabase/` over your repo, keeping your existing
   `config/`, `content/`, `components/Chrome.tsx` and `globals.css` untouched.
2. `pnpm add @supabase/supabase-js @supabase/ssr zod libphonenumber-js posthog-js posthog-node stripe`
3. `supabase start && supabase db reset && pnpm db:types`
4. Fill `.env.local` per `docs/SETUP-KEYS.md`. Supabase + `CRON_SECRET` are
   enough to run auth; Stripe and Bunny can stay blank for now (see note below).
5. `pnpm dev`

**Note on `env.ts`:** it validates Stripe and Bunny as required and will refuse
to boot without them — deliberately, so a production deploy cannot ship half
configured. To run Phase 2 alone, temporarily mark those keys `.optional()` in
`src/lib/env.ts`. Put it back before Phase 4.

## Test it by hand — 12 checks, about 15 minutes

**Works at all**
1. `/signup` → confirmation email arrives → link lands on `/dashboard`
2. `/login` with the new account → dashboard, four levels, all locked
3. Sign out → `/dashboard` redirects to `/login?next=/dashboard`
4. Sign in again → lands back on `/dashboard`, not the homepage

**Access**
5. `admin.from('enrollments').insert({level:1,...})` for your user → Freshman unlocks, 2–4 stay locked
6. Set `expires_at` to yesterday → Freshman locks again on refresh

**Security — these are the ones that matter**
7. **JavaScript disabled, submit `/login`.** Must still work. If it does not, the Server Action is not wired to the `<form action>` and people on bad connections cannot sign in.
8. `/login?next=https://example.com` → after sign-in you land on `/dashboard`, never example.com
9. Sign in with a wrong password, then a nonexistent email. **The message must be identical.** Different messages let anyone enumerate your students.
10. `/reset-password` with an unregistered address → same confirmation as a real one
11. Six rapid sign-in attempts → rate limited, and the message does not say whether the account exists
12. `pnpm build && grep -rE "service_role|sk_live|whsec_" .next/static/` → nothing

**Responsive** — 320 / 375 / 768 / 1024 / 1440
13. No horizontal scroll on any auth or portal page
14. `/login` on a short viewport: card centred, page does not collapse
15. Focus rings visible when tabbing; every input reachable by keyboard

## Still not testable

| | Blocked on |
|---|---|
| Checkout → enrollment | Surpaul's pricing. Plans are `published = false` by design |
| Video playback | Bunny account not provisioned |
| GHL passthrough | Jake's embed URL |
| `/learn/*`, `/account`, `/membership` | Phase 3–4. Dashboard links to them; they 404 today |

## Next, in order

1. **`/learn/[level]` + Bunny player** — needs the Bunny account
2. **`/membership` + Stripe checkout** — needs pricing approval
3. **`/account`** — profile edit against `PATCH /api/v1/me`, which already exists
4. **`/admin`** — extend the status map you already have with a role guard
