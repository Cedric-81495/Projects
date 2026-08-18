# GWOP University — Architecture Review

**Required initial output per §30.** Read this before any implementation is merged.
Author: Jhon (Website + App) · Reviewed against `gwop.zip` as uploaded · Aug 16

---

## 1 · Existing project analysis

The repo is a **static Next.js 15 marketing + event site.** It is in better shape than a
greenfield start, and almost none of it needs to be thrown away.

**What exists**

| Area | State |
|---|---|
| Framework | Next.js 15.5, React 19, TypeScript strict, App Router. Three runtime deps total. |
| Routes | `/`, `/830`, `/thanks`, `/go/[code]`, `/app`, `/app/[level]`, `/app/[level]/[module]`, `/admin`, `/privacy`, `/terms`, `/disclosures`, `/refunds`, `/sms-terms` |
| Styling | 736 lines of hand-authored CSS in `globals.css` with brand tokens in `:root`. Event selectors namespaced `.ev*`. |
| Content | Fully extracted to `src/content/*.ts` — non-developers edit copy without touching JSX |
| Config | `src/config/integrations.ts` and `src/config/membership.ts` — every integration value and every price is already a single editable constant |
| GHL embed | **Already built**, at `src/app/830/InterestForm.tsx` |
| Data layer | **None.** No Supabase, no API routes that accept data, no auth |
| Payments | **None.** `membership.ts` declares `PAYMENT.enabled = false` and `provider: null` |

**Findings that matter**

1. **The GHL integration point already exists and is well built.** `InterestForm.tsx`
   constructs the embed URL, appends `interest`, `interest_tag`, `s`, and an *allow-listed*
   set of `utm_*` params, truncates values, and falls back to a visible placeholder when
   `NEXT_PUBLIC_GHL_FORM_URL` is unset. This satisfies §5 and §10 today. It needs
   **extraction into `components/integrations/GHLLeadForm.tsx`**, not a rewrite — currently
   it is coupled to the `/830` page and cannot be reused on `/event`.

2. **`membership.ts` is already the centralized access/pricing model §13 asks for.** SKUs,
   level order, capability flags, promo structure and a `PRICING_PUBLISHED` gate are all
   there. It needs to be *joined to Supabase and Stripe*, not replaced. `PAYMENT.provider`
   moves from `null` to `'stripe'`.

3. **`src/content/modules.ts` is a flat, hardcoded array with `note`/`video`/`thumb` fields
   pointing at `public/`.** This is the single biggest architectural problem. Files under
   `public/` are served unauthenticated to anyone with the URL — the comment in that file
   admits it. The one real asset shipped so far,
   `public/notes/L1-01-credit-foundations-note.pdf`, is currently downloadable by the
   internet. **This must move to Supabase Storage + Bunny before any paid content lands.**

4. **The content model is two levels deep (level → module); §14 requires four**
   (course → module → lesson → video). The current `Module` type is really a lesson.

5. **`/admin` is a static status map, not an admin system.** It reads the hardcoded array.
   It has no auth. It is fine as a Maui/Sheena content-gap view and should be preserved,
   but §15's admin system is new work.

6. **`next.config.ts` sets a good CSP already** — `frame-src` is derived from the GHL form
   origin, `frame-ancestors 'none'`, no third-party script origins. Adding Stripe, Bunny and
   PostHog will require widening it deliberately; the current file is the right place.

7. **No `middleware.ts`.** Needed for session refresh and protected-route redirects.

8. **Security headers are set but `script-src` uses `'unsafe-inline'`.** Acceptable for a
   static site; once the portal handles sessions and payments this should move to a
   nonce-based CSP.

9. **`DRAFT = true` and the draft status bar are live.** §23 forbids draft labels on
   production pages. Resolution below.

**Duplicate systems found: none yet.** The repo has correctly avoided building a competing
lead form. That discipline must survive this phase — see §13 of this document.

---

## 2 · Recommended folder structure

```
src/
├── app/
│   ├── (marketing)/                 public site — statically rendered
│   │   ├── page.tsx                 /
│   │   ├── university/page.tsx
│   │   ├── [level]/page.tsx         /freshman /sophomore /junior /senior
│   │   ├── membership/page.tsx
│   │   ├── blueprint/page.tsx
│   │   └── contact/page.tsx
│   ├── (legal)/                     privacy · terms · disclosures · refunds · sms-terms
│   ├── (auth)/
│   │   ├── signup/  login/  logout/  reset-password/
│   ├── (portal)/                    ← every route here is session-guarded
│   │   ├── layout.tsx               server-side auth guard, one place
│   │   ├── dashboard/
│   │   ├── learn/[level]/[course]/[module]/[lesson]/
│   │   └── account/
│   ├── (admin)/admin/               role-guarded: staff+
│   ├── event/page.tsx               Aug 30 landing  (alias: /830)
│   ├── thanks/page.tsx
│   ├── go/[code]/route.ts           printed-QR redirect — DO NOT TOUCH
│   └── api/
│       ├── v1/…                     versioned JSON API — web AND Expo consume this
│       └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                          presentational only, zero business logic
│   ├── marketing/
│   ├── portal/
│   └── integrations/
│       ├── GHLLeadForm.tsx          ← the ONLY place a GHL embed appears
│       └── BunnyPlayer.tsx
├── lib/
│   ├── access/policy.ts             ← centralized authorization (§13)
│   ├── auth/                        session + role resolution
│   ├── services/                    membership · courses · progress · payments
│   ├── video/bunny.ts
│   ├── analytics/posthog.ts
│   ├── ghl/embed.ts                 URL builder + param allow-list
│   ├── stripe/
│   ├── http/                        handler wrapper · errors · rate limit
│   └── supabase/                    server · admin · browser clients
├── config/                          integrations.ts · membership.ts  (KEEP)
└── content/                         copy files  (KEEP)
supabase/migrations/
```

Route groups are load-bearing: `(portal)/layout.tsx` is a single server-side guard, so
adding a portal page cannot accidentally ship unguarded.

---

## 3 · Supabase schema design

Thirteen tables. Every one has RLS enabled with **default deny**, and no table gets a
policy without a matching test.

```
auth.users (Supabase)
   └─ profiles ──┬─ user_roles              RBAC: student · staff · admin · owner
                 ├─ enrollments             ← WHAT YOU CAN OPEN (level 1–4)
                 ├─ memberships             ← current plan state
                 ├─ subscriptions           Stripe recurring mirror
                 ├─ payment_references      orders / one-time payments
                 └─ lesson_progress         resume position + completion

university_levels (1 Freshman … 4 Senior)
   └─ courses
        └─ modules
             └─ lessons ── videos (Bunny GUID + duration; NO media bytes in Postgres)

membership_plans   purchasable SKUs ↔ Stripe price IDs
stripe_events      webhook idempotency ledger
audit_records      append-only; no UPDATE or DELETE policy exists for anyone
rate_limits        Postgres fallback for the edge limiter
```

**Naming note against §12.** The spec's list is honoured with two deliberate merges,
because splitting them would create two sources of truth for the same fact:

| §12 name | Implemented as | Why |
|---|---|---|
| `progress` + `completion` | `lesson_progress` (`status`, `position_sec`, `completed_at`) | Completion is a state of progress. Two tables would let them disagree. |
| `payment_references` | `payment_references` + `stripe_events` | Kept the spec's name. The second table is the idempotency ledger §16 requires. |
| `enrollments` | `enrollments` | Grants level access. This is the access-control table. |

**The two axes, kept separate on purpose**

- **Role** — what kind of user you are. Compromising an admin account must not grant
  content; buying Senior must not grant administrative power.
- **Enrollment** — which levels you may open, with `source`, `status` and `expires_at`.

**The policy that is the entire security posture:**

```sql
create policy "lessons at or below enrolled level"
  on public.lessons for select to authenticated
  using (published and level <= public.max_enrolled_level());
```

Even if a lesson ID leaks into a page, a query string, or an Expo deep link, Postgres
refuses to return the row. Hiding a link is not access control.

**Cumulative access.** Buying Junior grants levels 1–3 (`grants_cumulative`), matching
`membership.ts`'s `upgradeToHigherLevel: true`. Re-purchase **extends** expiry, never
shortens it.

---

## 4 · Authentication architecture

**Supabase Auth, email + password**, per §11 — which requires password reset, so passwordless
OTP alone does not satisfy the brief. Magic link stays enabled as a secondary method
because it measurably converts better on phones at an event.

| Concern | Decision |
|---|---|
| Session transport (web) | httpOnly, Secure, SameSite=Lax cookies via `@supabase/ssr` |
| Session transport (Expo) | `Authorization: Bearer <access_token>` — **same API, same policies** |
| Session refresh | `middleware.ts`, so a Server Component never renders on an expired token |
| Verification | `supabase.auth.getUser()` — re-validates against the auth server. **Never `getSession()`**, which only decodes locally and is forgeable |
| Password policy | Supabase minimum 10 chars + HaveIBeenPwned breach check enabled |
| Profile bootstrap | Postgres trigger on `auth.users` insert. A user cannot exist without a profile and a `student` role, regardless of which client signed them up |
| Route protection | `(portal)/layout.tsx` server guard + middleware redirect + RLS. Three layers; only the third is a guarantee |
| Role storage | `user_roles` table, **not** a column on `profiles`. A role column on a self-updatable table is a privilege-escalation hole waiting for a lazy UPDATE policy |
| Role grants | Writable only by `owner`, so a compromised admin cannot mint more admins |

**GHL is not an identity provider.** Nothing in the portal reads a GHL contact ID to decide
access.

---

## 5 · API / service architecture

```
UI components        presentational; zero business logic
      ↓
lib/services/*       business logic — membership, courses, progress, payments
      ↓
app/api/v1/*         versioned JSON, one wrapper, one error shape
      ↓
Supabase (RLS) · Stripe · Bunny · PostHog
```

Every route goes through one `route()` wrapper that supplies request IDs, rate limiting,
authentication, Zod validation, timing and a safe error boundary **by construction**. This
is the difference between "we rate limit our API" and "we rate limit the four routes
someone remembered."

**One error envelope**, so the website and the Expo app parse failures identically:

```jsonc
{ "error": { "code": "not_enrolled", "message": "…", "details": {…} }, "requestId": "…" }
```

`code` is a stable machine string. Internal detail — stack traces, Postgres constraint
names — never crosses this boundary; a raw driver error tells an attacker your table names.

**Endpoints (v1)**

```
GET    /api/v1/me                          identity + role + enrollments + progress, one round trip
PATCH  /api/v1/me
GET    /api/v1/catalog                     public: 4 levels, courses, counts, unlocked flags
GET    /api/v1/lessons?module=…
POST   /api/v1/lessons/:id/playback        → signed Bunny token, short TTL
PUT    /api/v1/progress                    idempotent upsert
POST   /api/v1/checkout                    → Stripe Checkout URL
GET    /api/v1/admin/students              staff+
POST   /api/webhooks/stripe                signature-verified, idempotent
GET    /api/v1/cron/expire                 constant-time shared-secret guard
```

`/api/v1/me` is one call by design: four sequential requests over venue cellular is a
visibly slower app.

---

## 6 · GHL embedded-form integration architecture

**Non-negotiable: one lead system, and it is Jake's.**

```
Printed QR → /go/[code] → /event?s=<role>
                              ↓
                  Next.js page we own and style
                              ↓
              <GHLLeadForm/>  ← iframe, Jake's URL
                              ↓
                    GHL CRM → tags → SMS/email → Blueprint booking
```

`components/integrations/GHLLeadForm.tsx` is the **only** file in the codebase that renders
a GHL embed. It:

- reads the embed URL from `config/integrations.ts` (env-backed), never hardcoded
- supports both iframe and script embeds, since GHL ships either depending on funnel type
- appends `interest`, `interest_tag`, `s`, and an **allow-listed** `utm_*` set — an
  arbitrary `?field=value` in a scanned link must never reach Jake's form
- truncates values (a pasted novel is not attribution)
- auto-resizes via `postMessage` where GHL sends height events, with a sane min-height
  fallback so the form is never clipped on a short phone
- renders a visible placeholder when the URL is unset, rather than an empty box
- has **no submit handler, no `onSubmit`, no POST, no database write**

**Documented limitation (§10).** Whether GHL's form consumes `?interest=` as a prefill
depends on how Jake built the field. If it does not, the supported alternatives, in order:
(a) Jake adds a hidden field bound to the query param — his side, minutes of work;
(b) separate embed URLs per interest; (c) drop the param and let the attendee pick inside
his form. **We do not compensate by storing the lead ourselves.** That would be the second
lead database §4 forbids.

**Confirmation behaviour.** Preferred: Jake redirects to `/thanks` on our domain, where the
founding-member CTA and the Blueprint booking link live. If GHL cannot redirect
cross-domain, the thank-you lives inside GHL and `/thanks` becomes a fallback. One question
to Jake settles this; it is on the blockers list.

---

## 7 · Stripe payment architecture

```
Browser → POST /api/v1/checkout   { product_slug, idempotency_key }
                 ↓  server resolves price from membership_plans
          Stripe Checkout Session (hosted)
                 ↓
          Stripe → POST /api/webhooks/stripe
                 ↓  verify signature · record event ID · then process
          payment_references.status = 'paid'
                 ↓
          grant_enrollments_for_payment()  ← SQL, locking, idempotent
                 ↓
          enrollments rows → RLS opens the lessons
```

**Five properties, in order of how badly it goes wrong when one is missing:**

1. **The client never sends a price.** It sends a slug. Price, currency and what the
   purchase grants are resolved server-side from `membership_plans`. A tampered request
   buys the same thing at the same price.
2. **Access is granted by the webhook, never by the success redirect.** A success URL is a
   UI event, not a payment. Anyone can navigate to it.
3. **Signature verified against the raw body.** Without it, granting yourself Senior is a
   curl command. This route must be `runtime = 'nodejs'` and must read `req.text()` — any
   middleware that parses JSON first breaks verification in a way that looks like a Stripe bug.
4. **Idempotent.** The event ID is inserted with a PK conflict check *before* processing.
   Stripe retries; a replay becomes a no-op rather than a second enrollment.
5. **Refunds revoke, partial refunds do not.** Installment plans legitimately refund one
   payment without ending access.

Test and live price IDs are stored in separate columns, so staging can never charge a real
card. `membership.ts` capability flags (`oneTimePayment`, `monthlyPayment`, `promoCodes`,
`foundingMember`) map onto Stripe modes and `allow_promotion_codes` — installment/split-pay
is a Stripe configuration change, not a rebuild.

---

## 8 · Course / module architecture

```
university_level → course → module → lesson → video(Bunny)
```

`content/modules.ts` becomes the seed for `lessons`, so nothing Maui and Sheena have already
produced is lost. Freshman is authored first and becomes the **master template**: the same
`course → module → lesson` shape is cloned for Sophomore, Junior and Senior.

**Bunny Stream**, per §14:

- Video bytes never touch Postgres or Supabase Storage. `videos` holds the Bunny GUID,
  library ID, duration and thumbnail key.
- The library is set to **token authentication**, so a raw Bunny URL is useless without a
  signature.
- `POST /api/v1/lessons/:id/playback` performs the authorization read **through the
  caller's RLS-bound client first**, and only then signs a token for the path that
  authorized read returned. Inverting those two steps — fetching with the service role "to
  get the GUID", then checking access — is exactly how paid content leaks.
- TTL 15 minutes, referer-locked, watermarked with the viewer's email. Watermarking is a
  deterrent, not a control.
- PDFs and workbooks live in a **private Supabase Storage bucket** with short-lived signed
  URLs. Nothing paid is ever served from `public/`.

**Migration debt:** `public/notes/L1-01-credit-foundations-note.pdf` is currently world-readable
and must move before any paid module ships.

---

## 9 · Security architecture

| Layer | Control |
|---|---|
| Transport | HTTPS only, HSTS `max-age=63072000; includeSubDomains; preload` |
| Headers | Nonce-based CSP, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| CSP additions | `js.stripe.com`, Bunny iframe origin, PostHog **reverse-proxied through our own domain** — keeps analytics first-party and out of ad-blocker range |
| AuthN | Supabase Auth, httpOnly cookies (web) / Bearer (Expo), `getUser()` never `getSession()` |
| AuthZ | RLS default-deny on all 13 tables + `lib/access/policy.ts` for UI affordances. **RLS is the guarantee; the TypeScript layer is for good error messages** |
| Input | Zod at every boundary, `.strict()` so unknown keys are rejected — no mass assignment |
| Injection | Parameterized queries only via the Supabase client. `SECURITY DEFINER` functions all pin `search_path` — an unpinned one is a privilege-escalation vector |
| Rate limiting | Upstash sliding window, **Postgres fixed-window fallback**. If both are down the request is refused, not allowed. Fail closed on the resource |
| Bots | Cloudflare Turnstile on signup and password reset |
| Webhooks | Stripe signature + event-ID ledger; cron guarded by `timingSafeEqual` |
| Secrets | Zod-validated at boot, process refuses to start if one is missing. `import 'server-only'` on every module touching a service key, so bundling it into client code is a build failure, not a breach |
| Logging | Structured JSON with a PII redaction list (email, phone, IP, tokens). A lead payload logged at debug level is a compliance incident regardless of intent |
| Errors | Opaque 500s with a request ID to the client; detail to the log |
| Audit | `audit_records`, append-only. An audit trail that can be edited is not an audit trail |
| Enumeration | Un-entitled lesson requests return **404, not 403** — telling a stranger that a lesson exists at a given ID makes the catalogue enumerable |

**Never in the browser:** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`BUNNY_API_KEY`, `BUNNY_TOKEN_SECURITY_KEY`, `GHL_API_TOKEN`, `CRON_SECRET`.
CI gate: `pnpm build && grep -rE "(service_role|sk_live|BUNNY_TOKEN)" .next/static/` must
return nothing.

---

## 10 · Responsive UI strategy

The existing CSS is kept. It is hand-authored to the approved Visual Build Package and
converting it now would be churn with real regression risk.

- **Mobile-first**, breakpoints at 520 / 820 / 1024 / 1280px
- **No fixed heights.** `min-height: 100svh` on shells; `svh` not `vh`, because `vh` is
  wrong under the iOS Safari URL bar. This directly fixes §22's "page shrinks on short
  content" — Privacy and Terms get `min-height` on the main region, not the body
- **Drawer:** `position: fixed; inset: 0`, focus trap, `Escape` to close, scroll lock via
  `overscroll-behavior` + a fixed body with preserved scroll offset so the page does not
  jump on open. The audit log in the repo records four separate drawer bugs — a
  `backdrop-filter` on `<header>` creating a containing block that clipped the drawer to
  64px is the instructive one, and the reason the drawer must be a sibling of the header,
  not a child
- **No horizontal overflow:** decorative elements clipped by an ancestor with
  `overflow: clip`, and a CI check asserting `scrollWidth <= clientWidth` at 320/375/768/1024/1440
- Fluid type via `clamp()`, tap targets ≥ 44px, safe-area insets on notched devices
- Accessibility floor: visible focus rings, `prefers-reduced-motion` respected, labelled
  form controls, contrast checked — brand gold on ivory is 2.2:1 and already correctly
  substituted with `--gold-ink` `#8A6D1F` at 4.7:1 for small text

---

## 11 · Deployment architecture

| Environment | Branch | Supabase | Stripe | Domain |
|---|---|---|---|---|
| Development | local | local / dev project | test | localhost |
| Staging | `develop` | staging project | test | staging.gwopuniversity.com |
| Production | `main` | prod project | **live** | gwopuniversity.com |

Vercel **Pro** — the Hobby tier forbids commercial use. Separate Supabase projects per
environment, not separate schemas in one: shared infrastructure means a staging migration
can take production down.

Repo, Vercel, Supabase, Stripe and Bunny accounts created under **client-owned** logins with
the developer as admin — never a personal account.

Also: daily Postgres backups verified with one **tested restore**, Sentry with PII
scrubbing, an alert if the checkout or webhook error rate exceeds ~1%, Dependabot on, and a
clean `npm audit` before handoff.

---

## 12 · Implementation plan

**Phase 0 — foundation (no user-visible change)**
Supabase projects · migrations 0001–0007 · RLS + policy tests · env schema · `middleware.ts`
· `lib/http` wrapper · extract `GHLLeadForm.tsx` from `InterestForm.tsx`

**Phase 1 — event surface** ⚠️ must land before Aug 23
`/event` with the extracted embed · `/830` kept as an alias so the printed QR is safe ·
param passthrough verified with Jake against a real GHL form · `/thanks`

**Phase 2 — auth**
signup · login · logout · password reset · `(portal)` guard · `/api/v1/me` · Turnstile

**Phase 3 — curriculum**
courses/modules/lessons/videos seeded from `content/modules.ts` · Bunny library + token auth
· signed playback · private bucket for PDFs · **move the leaked PDF out of `public/`**

**Phase 4 — commerce**
`membership_plans` ↔ Stripe prices · checkout · webhook · enrollment grants · `/membership`

**Phase 5 — progress + analytics**
`lesson_progress` · resume-where-you-left-off · PostHog with the §18 event list

**Phase 6 — admin**
students · enrollments · manual grants · content status (extends the existing `/admin`)

**Phase 7 — hardening**
Playwright E2E for both journeys · load test · security audit against §19 · Expo API smoke test

---

## 13 · Risks and blockers

| # | Item | Impact | Owner |
|---|---|---|---|
| 1 | 🔴 **Timeline conflict.** `CLAUDE.md` v3 §3 states *"No database. No Supabase. No API routes that accept data. No auth"* until after Aug 30, and freezes the build Aug 27. This spec asks for all of it now, 14 days before the event. | Building auth + payments during event-freeze week is how the event page breaks | **Felicia — needs an explicit decision** |
| 2 | 🔴 **Domain + DNS access** still unowned. QR lock is Aug 23 | Blocks Maui's print run; unrecoverable once printed | Felicia / Surpaul |
| 3 | 🔴 **Jake's form embed URL** not yet supplied | `GHLLeadForm` cannot be tested end to end | Jake |
| 4 | 🟠 **Does Jake's form read `?interest=`?** | Determines whether §10 works or degrades to option (b) | Jake |
| 5 | 🟠 **Can GHL redirect to our `/thanks`?** | Changes the shape of the confirmation step | Jake |
| 6 | 🟠 **Pricing unapproved.** `PRICING_PUBLISHED = false`, every price is `null` | Stripe products cannot be created; `/membership` renders "announced soon" | Surpaul |
| 7 | 🟠 **Bunny account + library not provisioned** | Blocks Phase 3 | Needs purchase decision |
| 8 | 🟡 **Paid PDF currently public** at `public/notes/…` | Paid IP downloadable by URL today | Us — fix in Phase 3 |
| 9 | 🟡 **Attorney legal copy** still placeholder | Cannot take real payments without terms and refund policy | Client's lawyer |
| 10 | 🟡 **Module files due Aug 22** | Portal ships with stub content otherwise — acceptable, by design | Maui + Sheena |

**My recommendation on #1:** run Phases 0 and 2–7 on a `develop` branch against a separate
Supabase project, and ship only Phase 1 (the extracted embed on `/event`) to production
before Aug 30. The event surface then changes by one component swap, tested, rather than
riding on top of a new auth system. This meets both documents.

---

## 14 · Requirements that cannot be implemented exactly as written

1. **§4 vs. the prior project guides.** `claude_gwop-integration-guide.md` and
   `claude_gwop-workflow1-dev-guide.md` both specify a write-first `leads` table with
   `/api/lead` posting to Postgres before forwarding to GHL. **§4 and §28 forbid that.**
   This spec wins: no `leads` table, no `/api/lead`, no retry queue. The trade-off is real
   and should be stated once — if GHL is unreachable during the event, those leads are lost
   with no local copy, and there is no live signup counter for the booth. Accepted as a
   deliberate architectural decision, not an oversight.

   > **SUPERSEDED 2026-08-18.** Felicia approved the write-first design after Jake
   > proposed replacing the embedded form with an inbound webhook: *"proceed with
   > saving the signup server-side first and forwarding to GHL with retries. GHL
   > remains the operational CRM/marketing source of truth. Keep the current form
   > live as fallback until the new flow passes end-to-end testing."*
   >
   > The distinction that makes this compatible with §4's intent:
   > `public.leads` is the **record of submission** — what was entered, when, from
   > which QR code, and the exact consent language shown. GHL remains where leads
   > are **worked**: tags, pipeline, nurture, attribution. It is not a second CRM
   > and must not grow into one.
   >
   > Implemented by migration `0008_leads.sql`, `POST /api/lead`,
   > `src/lib/ghl/sync.ts` and the `/api/v1/cron/lead-sync` retry job.
   > `GHLLeadForm.tsx` and `NEXT_PUBLIC_GHL_FORM_URL` are retained as the fallback
   > path Felicia asked for, and must not be deleted until the new flow is signed
   > off end to end.

2. **§23 "do not add a footer where the hierarchy does not include one"** conflicts with
   §7, which requires `/privacy`, `/terms` and `/contact` to exist and be reachable, and
   with SMS compliance, which requires disclosure links near the signup path. Implemented
   as: **no footer on `/event`** (nothing on the event page may click away from the form),
   footer everywhere else.

3. **§23 "no Draft labels on production pages"** conflicts with the repo's `DRAFT` mode,
   which exists so unapproved copy cannot ship silently. Implemented as: `DRAFT` is forced
   `false` in the production environment and can only be `true` on preview deployments. The
   safeguard is kept; the label never reaches a real visitor.

4. **§7 lists `/event`; the printed QR and `EVENT_PATH` currently target `/830`.** Both are
   served — `/830` permanently redirects to `/event` — because `/go/[code]` decouples the
   printed code from the destination. Changing `EVENT_PATH` after Aug 23 is still forbidden.

5. **§12's `progress` and `completion` as separate tables** — merged, per §3 above.

6. **§11 "password reset"** rules out a passwordless-only design. Email+password is
   primary; magic link is offered alongside it, which is an addition rather than a deviation.

7. **§10 param passthrough is contingent on Jake's form.** Cannot be guaranteed from our
   side; the fallback ladder is documented in §6 above.

---

*Nothing beyond Phase 0 foundations should be merged until items 1–3 of the risk register
have an owner's answer.*
