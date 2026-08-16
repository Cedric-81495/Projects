# Running the frontend · testing Stripe

---

# Part 1 — Preview the frontend

## Start it

```bash
pnpm install
supabase start && supabase db reset && pnpm db:types
pnpm dev                      # http://localhost:3000
```

`env.ts` validates Stripe and Bunny as required. To browse the site before
those accounts exist, temporarily mark them `.optional()` in `src/lib/env.ts`.
Put it back before Phase 4 — a production deploy that boots half-configured is
worse than one that refuses to start.

## Preview on a real phone

```bash
pnpm build && pnpm start -H 0.0.0.0
```

Open the printed Network URL on a phone on the same wifi. This matters more
than the desktop view: the audit already in your repo found seven layout bugs
that all looked fine in code review, including a hero that split to two columns
at 820px and a drawer clipped to 64px by a `backdrop-filter` on the header.

## What exists today

| Route | State |
|---|---|
| `/` `/830` `/thanks` `/go/[code]` | ✅ your existing pages, untouched |
| `/login` `/signup` `/reset-password` `/update-password` | ✅ new |
| `/dashboard` | ✅ new — four levels with real progress |
| `/membership` | ✅ new |
| `/privacy` `/terms` `/disclosures` `/refunds` `/sms-terms` | ✅ existing stubs |
| `/learn/[level]` | ❌ Phase 3 — the dashboard links to it |
| `/account` | ❌ `PATCH /api/v1/me` exists; the page does not |
| `/event` `/university` `/freshman`… | ❌ not yet |

Broken links from the dashboard are expected at this stage, not a bug.

## Seeing the portal with content

A fresh account is enrolled in nothing, so the dashboard shows the empty state.
To see it populated, grant yourself Freshman:

```sql
-- Supabase Studio → SQL Editor. Dev project only.
insert into public.enrollments (user_id, level, source, status)
select id, 1, 'manual_grant', 'active' from auth.users where email = 'you@example.test';
```

Refresh: Freshman unlocks with a progress bar, Sophomore–Senior stay locked.
Change `1` to `3` to see cumulative access.

---

# Part 2 — Testing Stripe

## Why this needs a note

`PRICING_PUBLISHED` is false and every price in `config/membership.ts` is
`null`, pending Surpaul. That is correct and should stay that way — but it means
checkout cannot be exercised without placeholder amounts.

**The rule:** placeholder prices exist only in the dev/staging Supabase project
and only in Stripe **test mode**. They are never quoted to anyone, never copied
to production, and `scripts/seed-stripe.ts` refuses to run against a live key.

## 1 · Keys

Stripe dashboard, **Test mode toggle ON**, Developers → API keys:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…
STRIPE_SECRET_KEY=sk_test_…
STRIPE_MODE=test
```

## 2 · Webhook secret — the step people skip

Local webhooks need the Stripe CLI. Without it nothing is granted, because
**access comes from the webhook, never from the success redirect.**

```bash
brew install stripe/stripe-cli/stripe     # or scoop / apt
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

That prints a `whsec_…`. It is **different** from the dashboard's secret and
changes each session:

```
STRIPE_WEBHOOK_SECRET=whsec_…
```

Restart `pnpm dev` after setting it. Leave `stripe listen` running in its own
terminal for the whole session.

## 3 · Seed test products

```bash
pnpm tsx scripts/seed-stripe.ts
```

Creates five test products, writes the price IDs into
`membership_plans.stripe_price_id_test`, and sets `published = true` so
`/membership` renders them. Idempotent — safe to re-run.

## 4 · Buy something

`/membership` → **Enroll** → Stripe Checkout.

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined — insufficient funds |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 0341` | Attaches, then fails on charge |

Any future expiry, any CVC, any postcode.

After a success you should see, in order:
1. `stripe listen` logs `checkout.session.completed`
2. `payment_references.status` flips `pending` → `paid`
3. `enrollments` gains rows — **levels 1..N, not just N**, because access is cumulative
4. `/dashboard` unlocks those levels

## 5 · The four tests that actually matter

Everything above proves the happy path, which is the easy part.

**a · Replay — prevents double-granting**

```bash
stripe events list --limit 1
stripe events resend evt_xxx
```

`enrollments` must be unchanged. `stripe_events` shows one row. If a second
enrollment appears, the idempotency gate is broken and every Stripe retry
during a launch will corrupt access.

**b · Tampered price — prevents paying $1 for Senior**

```bash
curl -X POST localhost:3000/api/v1/checkout \
  -H 'Content-Type: application/json' \
  -H 'Cookie: <your session cookie>' \
  -d '{"plan_sku":"GWOPU-SENIOR","amount_cents":100,"idempotency_key":"'$(uuidgen)'","return_path":"/dashboard"}'
```

Two things must happen: the request is **rejected with 422** (the Zod schema is
`.strict()`, so `amount_cents` is an unknown key), and even if it were accepted,
the session would carry the catalogue price because the server never reads an
amount from the client.

**c · Success URL — proves the redirect grants nothing**

Sign in as a user with no enrollment. Paste
`localhost:3000/dashboard?checkout=success&ref=<any-uuid>` into the address bar.
Nothing unlocks. A success URL is a UI event, not a payment.

**d · Unsigned webhook**

```bash
curl -X POST localhost:3000/api/webhooks/stripe -d '{"type":"checkout.session.completed"}'
```

Must return **400 Invalid signature**. If it returns 200, granting yourself
Senior access is a one-line curl command.

## 6 · Refunds

Stripe dashboard → Payments → Refund.

- **Full refund** → `enrollments.status` becomes `revoked`, levels re-lock
- **Partial refund** → status becomes `partially_refunded`, access is **kept**
  (installment plans legitimately refund one payment without ending access)

## 7 · Before going live

- [ ] Dashboard webhook endpoint pointing at the real domain, subscribed to the seven events in `SETUP-KEYS.md`
- [ ] `STRIPE_MODE=live` and live keys in Vercel production only
- [ ] Real products created; price IDs in `stripe_price_id_live`
- [ ] **Test-mode rows never copied to production.** Production `membership_plans` starts `published = false`, exactly as `0007_seed.sql` leaves it
- [ ] Refund and cancellation policy from the attorney live on `/refunds`
- [ ] One real card charged and refunded, end to end
