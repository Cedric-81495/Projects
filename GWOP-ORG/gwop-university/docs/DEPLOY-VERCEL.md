# Git → Vercel

---

## 1 · Repository — under a GWOP account, not yours

Create it under a **GWOP-owned GitHub account or org**, with you as an admin.
Whoever owns the repo owns the business's website; a personal account makes you a
single point of failure and makes handoff awkward later.

```bat
cd C:\gwop
git init
git add .
git commit -m "GWOP University — site + platform layer"
git branch -M main
git remote add origin https://github.com/GWOP-ORG/gwop-university.git
git push -u origin main
```

Then create the staging branch, which is where everything runs until Felicia
rules on the timeline conflict in `ARCHITECTURE.md` §13.1:

```bat
git checkout -b develop
git push -u origin develop
```

### Before the first push — verify nothing secret is staged

```bat
git status --short
```

`.env.local` must **not** appear. `.env.example` and `.env.local.example`
should — they are templates with no real values. If a real key ever lands in a
commit, rotate that key; deleting the file later does not remove it from history.

---

## 2 · Vercel project

vercel.com → **Add New → Project** → import the repo.

| Setting | Value |
|---|---|
| Framework | Next.js (auto-detected) |
| Root Directory | leave blank — `package.json` is at the repo root |
| Build Command | default (`next build`) |
| Install Command | `npm install` |
| Node.js Version | **22.x** — Settings → General. The default may be older than `engines` allows |
| Production Branch | `main` |

**Use the Pro plan.** Hobby forbids commercial use, and the cron job in
`vercel.json` needs Pro.

### ⚠️ Set the environment variables BEFORE deploying

`src/lib/env.ts` validates everything at boot and throws on a missing value.
That is deliberate — a deploy that boots half-configured and silently grants
nobody access is worse than one that refuses to start. But it does mean your
first build fails if you click Deploy with an empty environment.

---

## 3 · Environment variables

Settings → Environment Variables. Vercel has three scopes; **tick them
deliberately.** The common, expensive mistake is applying one value to all three
and pointing Preview at the production database, so a test signup writes a real
student record.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://gwopuniversity.com` | leave unset — see below | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | prod project | **staging project** | dev project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod | staging | dev |
| `SUPABASE_URL` | prod | staging | dev |
| `SUPABASE_ANON_KEY` | prod | staging | dev |
| `SUPABASE_SERVICE_ROLE_KEY` 🔒 | prod | staging | dev |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` | `pk_test_…` | `pk_test_…` |
| `STRIPE_SECRET_KEY` 🔒 | `sk_live_…` | `sk_test_…` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` 🔒 | live endpoint secret | test endpoint secret | CLI secret |
| `STRIPE_MODE` | `live` | `test` | `test` |
| `BUNNY_*` 🔒 | real | real | real |
| `NEXT_PUBLIC_POSTHOG_KEY` | real | real | blank |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://gwopuniversity.com/ingest` | — | — |
| `NEXT_PUBLIC_GHL_FORM_URL` | Jake's URL | Jake's URL | Jake's URL |
| `CRON_SECRET` 🔒 | `openssl rand -base64 48` | different value | different value |
| `TURNSTILE_SECRET_KEY` 🔒 | real | real | blank |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | real | real | blank |

🔒 = never prefix with `NEXT_PUBLIC_`. That prefix is what puts a value in the
browser bundle.

**Preview URLs are generated per deployment**, so a fixed `NEXT_PUBLIC_SITE_URL`
would be wrong on every preview. Leave it unset for Preview and read
`VERCEL_URL` instead, or accept that email redirect links point at production
while testing on previews.

---

## 4 · Supabase — allow the deployed URLs

Authentication → URL Configuration. Sign-up confirmation and password reset both
break silently without this: the email arrives, the link is rejected.

- **Site URL:** `https://gwopuniversity.com`
- **Redirect URLs:**
  ```
  https://gwopuniversity.com/auth/callback
  https://*.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

Run the migrations against each project separately — `0001` through `0007`, in
order. **Do not run `0007_seed.sql` against production.** It publishes plans and
creates content; the guard at the top only fires if `app.environment` is set.

---

## 5 · Stripe webhook

Dashboard → Developers → Webhooks → Add endpoint:

```
https://gwopuniversity.com/api/webhooks/stripe
```

Events: `checkout.session.completed`,
`checkout.session.async_payment_failed`, `payment_intent.payment_failed`,
`charge.refunded`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.payment_failed`.

Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. **It is not the
same as the `whsec_` from `stripe listen`** — that one is CLI-only and rotates
per session. Wrong secret means every webhook returns 400 and nobody who pays
gets access, with no visible error on the customer's side.

Create a **separate test-mode endpoint** pointing at your staging domain, with
its own secret for the Preview scope.

---

## 6 · Domain

Vercel → Settings → Domains → add `gwopuniversity.com`, then follow the DNS
records it shows you at your registrar.

🔴 This is the **Aug 23 QR lock** blocker. Maui's print run depends on the
destination URL being final, and once printed it cannot change. `/go/[code]`
exists so the *destination* can be re-pointed after printing — but the **domain
in the QR cannot.**

While DNS propagates, add the email records too — `SPF`, `DKIM` and `DMARC` for
whatever sends your Supabase auth emails. Without them, confirmation emails go to
spam and it looks like signup is broken.

---

## 7 · Branch workflow

```
develop  →  automatic Preview deploy  →  staging Supabase + Stripe test
main     →  Production                →  prod Supabase + Stripe live
```

Every pull request gets its own preview URL. That is what you send Jake, Maui and
Surpaul to review, instead of describing changes in chat.

Until Felicia rules on §13.1 of `ARCHITECTURE.md`, **keep the platform work on
`develop`.** Production should receive nothing before Aug 30 except the extracted
`GHLLeadForm` component.

---

## 8 · First-deploy checklist

- [ ] `git status` clean; no `.env.local` committed
- [ ] Node version set to 22.x in Vercel
- [ ] Every variable present in the Production scope — a missing one fails the build by design
- [ ] Migrations `0001`–`0006` run on prod; `0007` **not** run on prod
- [ ] Storage bucket `course-materials` exists with **Public OFF**
- [ ] Supabase redirect URLs include the deployed domain
- [ ] Stripe webhook created; secret matches the scope
- [ ] After deploying, confirm no secret shipped:
      Vercel → Deployment → Source, or locally
      `npm run build` then
      `findstr /S /M "service_role sk_live whsec_" .next\static\*`
      — must return nothing

## 9 · When the build fails

| Symptom | Cause |
|---|---|
| `Invalid server environment: …` | A variable is missing in that scope. The message names it |
| `You're importing a component that needs "server-only"` | A client component imported from `@/lib/env` — use `@/lib/env.public` |
| `Cannot find module 'vitest'` | `tests/**` is excluded in `tsconfig.json`; restore that exclusion |
| Signup email link "invalid" | The redirect URL is not in Supabase's allow-list |
| Webhook 400s, nobody gets access | Wrong `STRIPE_WEBHOOK_SECRET` — CLI secret used instead of the endpoint's |
