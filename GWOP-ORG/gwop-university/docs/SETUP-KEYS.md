# Setup — every credential, where to get it, where it goes

**Do not paste any of these into a chat, ticket, or commit.** Treat a secret that
has been sent through any of those as compromised and rotate it. Values go in
`.env.local` locally and Vercel's encrypted environment variables when deployed.

Create every account under a **GWOP-owned login** with you as an admin — not a
personal account. Whoever owns the login owns the business's data.

---

## Order matters

Supabase and the domain first: nothing else can be configured without them.
Bunny and Stripe can wait until Phases 3 and 4.

---

## 1 · Supabase — required now

Create **three separate projects**: `gwop-dev`, `gwop-staging`, `gwop-prod`.
Not three schemas in one project. Shared infrastructure means a staging
migration can take production down.

Dashboard → Project Settings → API:

| Value | Env var | Notes |
|---|---|---|
| Project URL | `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` | Same value, both names |
| `anon` `public` key | `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe in the browser — RLS constrains it |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ **Bypasses all RLS.** Server only. Never a `NEXT_PUBLIC_` name |

Then, in the dashboard:

- **Authentication → Providers → Email**: enable, confirm email ON
- **Authentication → Policies**: minimum password length 10, "Prevent leaked passwords" ON
- **Authentication → URL Configuration**: Site URL = your domain; Redirect URLs must include `https://<domain>/auth/callback` and `http://localhost:3000/auth/callback`
- **Storage**: create bucket `course-materials` with **Public OFF**. Verify this. A public bucket makes every signed-URL check in the codebase decorative.
- **Database → Backups**: confirm daily backups, and test one restore before handoff

## 2 · Domain — 🔴 blocking Aug 23

Not an API key, but the highest-consequence item on the list. Registrar and DNS
access is needed to point the domain at Vercel, and the printed QR codes cannot
be produced until the destination is locked.

## 3 · Cron secret — required now

Generate locally; it is not issued by anyone:

```bash
openssl rand -base64 48
```

→ `CRON_SECRET`. Guards `/api/v1/cron/expire`, which mutates access.

## 4 · Cloudflare Turnstile — recommended now

dash.cloudflare.com → Turnstile → Add site.

| Value | Env var |
|---|---|
| Site key | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Secret key | `TURNSTILE_SECRET_KEY` |

Without it, signup and password reset are open to scripted abuse — which costs
real money once Supabase is sending confirmation emails.

## 5 · PostHog — Phase 5

posthog.com → Project Settings.

| Value | Env var |
|---|---|
| Project API key | `NEXT_PUBLIC_POSTHOG_KEY` |
| — | `NEXT_PUBLIC_POSTHOG_HOST=https://<your-domain>/ingest` |

`HOST` points at our own reverse proxy, not `app.posthog.com`, so analytics stay
first-party and are not blocked by ad blockers.

## 6 · Bunny Stream — Phase 3

bunny.net → Stream → create a library.

| Value | Env var |
|---|---|
| Library ID | `BUNNY_LIBRARY_ID` |
| Stream API key | `BUNNY_API_KEY` |
| Token Authentication Key | `BUNNY_TOKEN_SECURITY_KEY` |
| Pull zone hostname (`vz-….b-cdn.net`) | `BUNNY_CDN_HOSTNAME` |

**In the library settings, turn Token Authentication ON**, and add your domain
to Allowed Referrers. Without that switch these tokens are decorative: the raw
embed URL plays for anyone holding the video GUID, and GUIDs leak through page
source and shared screenshots.

## 7 · Stripe — Phase 4, blocked on pricing

dashboard.stripe.com. Start in **test mode**.

| Value | Env var |
|---|---|
| Publishable key | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Secret key | `STRIPE_SECRET_KEY` |
| Webhook signing secret | `STRIPE_WEBHOOK_SECRET` |
| — | `STRIPE_MODE=test` (or `live`) |

Webhook endpoint: `https://<domain>/api/webhooks/stripe`, subscribing to
`checkout.session.completed`, `checkout.session.async_payment_failed`,
`payment_intent.payment_failed`, `charge.refunded`,
`customer.subscription.updated`, `customer.subscription.deleted`,
`invoice.payment_failed`.

⚠️ **Products cannot be created yet.** `PRICING_PUBLISHED = false` and every
price in `config/membership.ts` is `null` pending Surpaul's approval. Create the
Stripe account now; create the products when the numbers land, then paste the
price IDs into `membership_plans.stripe_price_id_test` / `_live`.

## 8 · Upstash Redis — optional

Only improves rate limiting. Omitted, the Postgres fallback in `0005` handles it
with coarser windows. Not worth blocking on.

## 9 · GoHighLevel — from Jake, not an account you create

| Value | Env var |
|---|---|
| Form embed URL | `NEXT_PUBLIC_GHL_FORM_URL` |
| Blueprint booking link | `NEXT_PUBLIC_BOOKING_URL` |

Both are **public URLs, not secrets.** There is deliberately no GHL API token in
this project: we embed his form and never touch his leads.

---

## Verify before you trust it

```bash
pnpm build
grep -rE "service_role|sk_live|sk_test|whsec_|BUNNY_TOKEN|CRON_SECRET" .next/static/
```

Must return nothing. If it prints anything, a secret is in the browser bundle —
stop, rotate that key, and find the import.
