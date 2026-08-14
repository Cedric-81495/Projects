# CLAUDE.md — GWOP University

Project constitution. Read fully before writing code. Place at repo root — loaded
automatically every session. **These rules override default behaviour and general best
practice. Follow them exactly.**

**Version 4 — Aug 14.** Supersedes v3. Updated against Felicia's confirmed directions
(Aug 14, 8:08 AM) and Jake's status update (Aug 14, 8:30 AM). **Three previously open
questions are now closed — see §12.**

---

## 1. What this is

A website and event experience for **GWOP University** — paid financial education covering
credit, funding, business and wealth — built for a live U.S. event on **Aug 30** called
*Everybody Gotta Eat*.

Attendees at a booth scan a printed QR code on their own phones, land on an event page,
choose what they need help with, and submit a form that pushes them into GoHighLevel for
SMS/email follow-up and a call with the founder.

**Hard dates from the tracker. These do not move.**

| Date | Milestone |
|---|---|
| **Aug 20** | 8/30 landing page + Freshman–Senior overview live |
| **Aug 21** | Jake's form connected · interest selection · thank-you page |
| **Aug 22** | Integration gate — signup + thank-you working end to end |
| **Aug 23** | 🔴 **QR destination URL locked** — blocks Maui's print run |
| **Aug 26** | iPhone + Android + cellular test matrix passed |
| **Aug 27** | System lock + U.S. handoff. **No build changes after this.** |
| **Aug 30** | Event. Unrepeatable. |

---

## 2. Team boundaries — do not build across them

| Person | Owns | Our interface |
|---|---|---|
| **Surpaul** | Founder. Credit repair specialist. Approves offer, pricing, brand, messaging | Approves; supplies copy |
| **Felicia** | Right hand. Authored the workflow + tracker. Business context, scope, offer definition | Source of truth for decisions |
| **Jake** | **Everything inside GoHighLevel** — the signup form itself, lead fields, tags, pipeline, SMS/email automation, AI chat. A2P 10DLC approved ✅ | **We embed his form. We never build one.** |
| **Maui** | Module integration, website content/asset support, event signage, handoff folder | Consumes our content files + QR URL |
| **Sheena** | Module production from Surpaul's material | Indirect, via Maui |
| **Us (Jhon)** | **Website, event landing page, thank-you page, QR destination, student app (later)** | — |

**The single most important boundary:** Jake owns the form. We own the page around it. If a
task asks us to build a signup form, collect a phone number, or store a lead — **stop and
escalate.** That is his system, his compliance surface, and his A2P registration.

---

## 3. Tech stack — fixed. Do not substitute.

### Phase 1 — the Aug 30 event site (this is all that matters until Aug 27)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15**, App Router, React 19, TypeScript `strict` | One repo, edge-fast, preview URL per push |
| Hosting | **Vercel** (Pro — Hobby forbids commercial use) | Handles the 4-hour spike with zero ops |
| Styling | **Plain global CSS with custom properties** | See the note below |
| Content | **Typed `.ts` files in `src/content/`** | Non-developers edit copy without touching JSX |
| Form | **Jake's GoHighLevel form, embedded via iframe** | His lane |
| QR | **`qrcode` package, generated in-repo** | Never a third-party QR service |
| Package manager | **pnpm** |
| Analytics | **None before Aug 27** | Nothing goes in front of the form |

**⚠️ No database. No Supabase. No API routes that accept data. No auth.** Phase 1 is a
static marketing site plus one iframe. Adding a backend before Aug 30 adds risk and buys
nothing, because Jake's form is the system of record.

**On CSS — a deliberate deviation.** Earlier drafts of this file specified Tailwind +
shadcn/ui. **That is now wrong for this project.** The approved design already exists as
hand-authored CSS matching the Visual Build Package exactly, and converting it to Tailwind
before Aug 20 is pure churn with no benefit and real regression risk. Use
`src/app/globals.css` with the design tokens in `:root`. Event-page selectors are prefixed
`.ev*` so they cannot collide with website styles. If you think this should be Tailwind,
you are optimising for the wrong thing — the deadline is in seven days.

### Phase 2 — the student app (after Aug 30, separate effort)

Do not build any of this before Aug 27, and do not add its dependencies to Phase 1.

| Layer | Choice |
|---|---|
| Auth + DB + storage | **Supabase** — email OTP, Postgres with RLS default-deny |
| Video | **A real video host** (Cloudflare Stream / Bunny / Mux) with signed playback |
| Access control | Enforced by **RLS policy**, never in the UI |

---

## 4. Routes

```
/                  website — brand, pathway, materials, enrollment
/830               event landing page ← the QR destination
/thanks            confirmation after Jake's form submits
/go/[code]         redirect → /830?s=<role>   ← THE PRINTED QR POINTS HERE
/privacy /terms /sms-terms /refunds /disclosures   legal (attorney copy only)
/app               student app — Phase 2, stub until then
```

**`/go/[code]` is not optional.** The printed QR encodes `/go/1`, never `/830`. Once those
codes are printed the URL is permanent, so the redirect is the only way to change the
destination without reprinting. Unknown codes must redirect to `/830`, never 404 — a dead
QR at the booth is unrecoverable.

---

## 5. File ownership — the handoff contract

The Visual Build Package's team standard: *"If a file cannot be handed directly to the next
person and used, it is not finished."* This table is how we satisfy it.

| File | Who edits it | Contains |
|---|---|---|
| `src/content/site.ts` | Surpaul / Felicia, applied by Maui | All website copy |
| `src/content/event.ts` | Surpaul (offer), Maui | Event page copy, incentives, thank-you |
| `src/content/pathway.ts` | Maui | Freshman–Senior labels and details |
| `src/config/integrations.ts` | **Jhon**, with input from Jake | Form URL, QR codes, interest list, campaign params, booking link, draft flag |
| `src/config/membership.ts` | **Felicia defines, Surpaul approves** | Level pricing, billing modes, promo codes, offers, refund policy |
| `src/app/globals.css` | **Jhon only** | Design tokens + all styling |
| `src/app/**/page.tsx` | **Jhon only** | Structure. **Never copy.** |

**Rules that make this work:**

1. **No copy inside a component, ever.** Every visible string comes from `src/content/`. If
   you find yourself typing a sentence in JSX, stop and put it in a content file.
2. **No integration value inline.** Form URLs, QR codes, tags come from
   `src/config/integrations.ts`.
3. `pending: true` on any content value marks it unconfirmed. Draft mode highlights it.
4. `DRAFT` in the config gates the status bar and highlighting. **It stays `true` until
   every `pending` flag is cleared.** Never set it false to make a screenshot look clean.

---

## 6. Non-negotiable invariants

Violating any of these is a bug even if the feature works. If a request would break one,
**say so and propose an alternative instead of complying.**

### Scope

1. **We never build a form that collects personal data.** No name, email, phone or consent
   field in this repo. Jake's iframe handles all of it. If asked, refuse and escalate.
2. **Never collect SSN, date of birth, address, credit report data or payment details**
   anywhere, in any phase, on any page.
3. No analytics, chat widget, or third-party script on `/830` before Aug 27. Nothing goes
   in front of the form.

### Copy

4. **Hero copy on `/` is prescribed by the Visual Build Package p.5** — "Knowledge Pays.",
   the sub-line, and "Start your blueprint". **Do not reword, improve, or shorten it.**
5. **Event hero copy is prescribed by p.7** — "BUILD YOUR GWOP BLUEPRINT" / "Credit.
   Funding. Business. Wealth." Same rule.
6. **Legal copy is attorney-supplied only.** Never draft, paraphrase, or tidy it. It lives
   in `src/content/site.ts` under `legal` and is marked `pending` until it arrives.
7. **Never write credit-outcome claims** — no score numbers, no "remove negative items", no
   guaranteed results, no guaranteed funding amounts. Surpaul is a credit repair
   specialist, so CROA is live: promising removal of accurate information is unlawful.
   Refuse and flag.

### Design fidelity

8. The Visual Build Package is **approved and prescriptive.** Palette, the four course
   cards, and the alternating emerald/black pathway bars are specified, not suggestions.
   Do not introduce colours, fonts, or card treatments outside it.
9. **Every screen must feel like it belongs to the same university** (p.2 team rule). One
   token set, one card style, one button system across website, event page and app.

### The event page

10. `/830` has **no navigation menu** and no outbound links except privacy and terms. Every
    clickable thing that isn't the form is a lost signup.
11. `/830` is `noindex`.
12. The interest selector precedes the form (p.6: SCAN → **CHOOSE** → CAPTURE) and passes
    `interest`, `interest_tag`, `s` and allow-listed campaign params through to Jake's form.
    **Only allow-listed params are forwarded** — a scanned URL must never be able to inject
    an arbitrary field into his form.
13. Interest values come from `INTERESTS` in the config. Jake builds one nurture branch per
    value — **adding or removing one silently breaks his automation.** Changes require
    Felicia's decision and a message to Jake.
14. There is always a "not sure yet" path submitting `INTEREST_FALLBACK`. Without it,
    anyone who won't categorise themselves is a lost lead.

### Performance and access

15. `/830` **LCP < 1.5s on throttled 3G.** It loads over congested venue cellular.
16. The form must be reachable without pinch-zoom at 375×667. All tap targets ≥ 44px.
17. No hero video, no carousel, no render-blocking font. Fonts self-hosted and subset in
    production — Google Fonts is acceptable in preview only.
18. Semantic HTML, real `<button>` elements, `aria-pressed` on toggles, visible focus.
    A staffer will be helping someone use this in bright light.

---

## 7. Design system — official brand identity

From the **GWOP University Brand Identity** sheet. These are the authoritative values and
they supersede anything sampled from the Visual Build Package. Do not adjust.

```css
--emerald: #0D5B3F;   /* Growth & Ambition   — primary: buttons, headings, bars */
--forest:  #1E3E2F;   /* Stability & Authority — dark bands, premium contrast   */
--gold:    #C8A34A;   /* Wealth & Excellence — accents, rules, borders, numbers */
--ivory:   #F7F3E9;   /* Clarity & Refinement — page background                 */
--stone:   #E7E4DD;   /* Balance & Structure — hairlines, borders, dividers     */
--ink:     #1A1D1B;   /* body text  */
--muted:   #5F6560;   /* secondary  */
--gold-ink:#8A6D1F;   /* see the accessibility note below */
```

**The brand palette contains no true black.** Dark bands use **Forest Green `#1E3E2F`**.
Never introduce `#000000` or the near-black from the Visual Build Package.

### Typography

- **Primary — Cormorant Garamond (serif).** Display only: `h1`, `h2`, and the wordmark.
  It has a small x-height and thin strokes, so **never below ~22px** and never for form
  labels, buttons or body copy.
- **Secondary — Poppins (sans).** Everything else: `h3`, `h4`, body, UI, buttons, labels.

### ⚠️ One deliberate accessibility deviation — flag to Felicia

Brand gold `#C8A34A` on ivory is **2.2:1**, which fails WCAG for text. The brand sheet uses
it for small labels; we use **`--gold-ink` `#8A6D1F`** (4.7:1) for small gold *text* on
ivory instead. Visually near-identical, legible in bright convention-hall light. Full brand
gold is still used for rules, borders, numbers, and all gold on dark backgrounds.

**Verified contrast:** emerald on ivory 7.2:1 · white on emerald 8.0:1 · white on forest
11.6:1 · gold on forest 4.9:1.

### Logos — `public/`

Two assets, two jobs. **Do not swap them.** Updated Aug 14 with Felicia's supplied files.

| Asset | Source | Use |
|---|---|---|
| `hero-crest-900/600/400.png` / `.webp` | `Primary-logo-w-bg.jpeg`, white background cut | The image beside the black card on `/` (p.5) and `/830` (p.7). Ornate, portrait 0.64 ratio |
| `mark-512/256/128/64.png` / `.webp` | `Gwop_University_logo.png`, already transparent | Nav, footer, event bar, favicons, avatars, stamps |
| `src/app/icon.png`, `apple-icon.png` | the mark | Next.js auto-favicon. Apple icon gets an ivory plate — iOS renders transparency as black |

**Why two.** The ornate Blueprint artwork is unreadable at 34px — it becomes a green
smudge in the nav. The shield mark stays legible. Conversely the shield is too plain to
carry the hero, where p.5 and p.7 both show the ornate piece.

**Background removal method** (`make_assets.py`, kept for when the artwork is revised): the
white was cut by flood-filling from the image border, so only white *connected to the edge*
was removed. A global white threshold would have punched holes through the dome, columns
and banner, which are all white marble. Verified: 100% centre opacity, no halo on forest.

**Serve WebP first** — the 600px hero is 1.0MB as PNG and 217KB as WebP; the 400px event
variant is 88KB. On the event page's 1.5s LCP budget that difference matters.

**Remaining asset gap:** both files are raster. The mark is 2779px so it is fine for
screen and most print, but the ornate hero piece came from a 1024px JPEG — usable on
screen, marginal for a large table sign. **Ask Maui/Felicia for vector (SVG/AI/EPS) before
Maui's Aug 24 print run**, or confirm the print size stays small enough for raster.

### Prescribed components (Visual Build Package p.4, p.5)

- Hero: dark rounded card, gold eyebrow, serif H1, emerald pill button, primary logo right
- Course cards: white, 1.5px gold border, uppercase level name, gold `ENTER ›`
- Pathway: alternating emerald/forest bars, gold numbered circles, gold connectors,
  closing on *Capstone: The Completed GWOP Blueprint*

**Prescribed components** (p.4, p.5):
- Hero: black rounded card, gold eyebrow, white H1, emerald pill button, crest right
- Course cards: white, 1.5px gold border, uppercase emerald level name, gold `ENTER ›`
- Pathway: alternating emerald/black bars, gold numbered circles, gold connectors,
  closing on *Capstone: The Completed GWOP Blueprint*

The crest currently exists only as low-res raster on black. **Request the vector.** Until
it arrives it is a marked placeholder and must not ship.

---

## 8. Conventions

- Server Components by default. `'use client'` only where interaction requires it, as low in
  the tree as possible. The interest selector is the only client component on `/830`.
- Content is imported, never inlined. `import { event } from '@/content/event'`.
- Derive types from content with `as const` — never hand-write a parallel interface.
- No barrel `index.ts` files.
- Never swallow an error. Fail loudly in development, gracefully in production.
- Comments explain **why**, not what.
- Conventional commits (`feat:`, `fix:`, `chore:`). Small, single-purpose PRs.

---

## 9. Commands

```bash
pnpm dev
pnpm build        # must pass before any push
pnpm typecheck    # must be clean, no ignored errors
pnpm lint
pnpm qr           # regenerate QR codes into qr-out/
```

**Definition of done** — matching the tracker's own test column:

| Task | Proof required |
|---|---|
| Landing page | Mobile review passed |
| Level overview | Reviewed by Maui |
| Form connected | Test lead submitted, confirmed by Jake in GHL |
| Interest selection | All values tested, each arrives correctly |
| Thank-you page | Reached by a real submit |
| QR URL | One URL delivered to Maui in writing, opens correctly |
| Device test | Pass/fail matrix, iPhone + Android + cellular |

---

## 10. Environment variables

```
NEXT_PUBLIC_SITE_URL=          # live origin, used by the QR generator
NEXT_PUBLIC_GHL_FORM_URL=      # Jake's form embed URL
NEXT_PUBLIC_BOOKING_URL=       # Beast's 1:1 Blueprint calendar (GHL), optional
```

That is the entire list for Phase 1. **If a task introduces a secret, question the task** —
Phase 1 has no backend and therefore nothing to keep secret. Never commit `.env*`.

---

## 11. Working agreements for AI sessions

- **Ask before assuming** on the interest list, prescribed copy, legal text, the offer, or a
  new dependency. Guessing creates silent failures nobody sees until after the event.
- **Refuse and escalate**, don't comply, if asked to: build a data-collecting form, reword
  prescribed hero copy, draft legal text, write credit-outcome claims, or set `DRAFT=false`
  with items still pending.
- **Do not refactor beyond the task.** Seven days to the freeze; every unrequested change
  costs re-testing.
- **Flag deadline risk explicitly.** If a request jeopardises Aug 23 (QR lock) or Aug 27
  (handoff), say so before starting.
- **Nothing lands on `/830` after Aug 24 except a confirmed bug fix.**
- Prefer boring, obvious solutions. Clever code has no owner at 2pm on Aug 30.
- When finishing, state what changed, what you did **not** cover, and what needs manual
  testing on a real phone.

---

## 12. Status

**Resolved**
- [x] A2P 10DLC approved (Jake, Aug 13) — SMS + calls live. **Test sends reach real phones.**
- [x] Visual direction approved — Visual Build Package is the spec
- [x] Pathway confirmed: Freshman → Sophomore → Junior → Senior + Capstone
- [x] Form ownership settled: Jake builds it, we embed it
- [x] **Interest list — CLOSED (Felicia, Aug 14).** Five options. Attendee-facing labels
      and Jake's GHL tag text are both in `src/config/integrations.ts` and differ on
      purpose: *Business Funding* → tag `Business Funding`, *Business / Entrepreneurship*
      → tag `Entrepreneurship`, *Wealth Building* → tag `Wealth Building`, plus *Credit*
      and *Wellness*. Jake needs six branches — five plus `Unspecified`.
- [x] **No account creation in the event funnel (Felicia §10).** QR → landing → quick
      signup → confirmation. Account creation belongs to membership, not lead capture.
- [x] **Payment stays out of this repo (Felicia §10)** — "a separate but connected
      component". The contract it must implement is written in `src/config/membership.ts`.
- [x] **Pricing is configuration, not layout (Felicia §1)** — `src/config/membership.ts`,
      gated by `PRICING_PUBLISHED`. No number can render while that is false.
- [x] One landing URL, one QR destination; attribution on allow-listed campaign params
- [x] **Brand assets received (Felicia, Aug 14).** Ornate Blueprint artwork → hero on `/`
      and `/830`, white background cut. New shield mark → nav, footer, favicons. The old
      derived crest files are deleted; nothing references them.
- [x] **Homepage hero reduced to ONE button**, as p.5 specifies. The previous "See the
      pathway" secondary CTA competed with "Start your blueprint".
- [x] **Hero and event cards are now BLACK** (`--black: #0F1210`), not forest. Felicia §4
      lists "Black for premium contrast" and package p.5 and p.7 both render the card in
      near-black. Forest remains the secondary dark for bands and the footer.
- [x] **All four §13 legal routes exist**: `/privacy`, `/terms`, `/sms-terms`, `/refunds`.
      The last two were missing. `/refunds` renders a holding line only — Felicia §1: "Do
      not publish a final policy until approved."
- [x] **`/830` hero rebuilt to p.7.** The artwork is a SIBLING of the black card, not a
      child — the grid belongs on `.evhero`. My first attempt made `.evcard` itself the
      grid, which threw the kicker into the crest column and left a large dead gap.
      Also removed, per review: the `Everybody Gotta Eat · Aug 30, 2026` badge and the
      `Free · Takes 2 minutes` line. Neither appears in p.7 and both pushed the CTA
      further down a phone screen. Time and location still render from
      `event.details` once Felicia confirms them.
- [x] **Module asset slots added** (`note`, `video`, `thumb`, `workbook` on `Module`).
      Maui's task is "upload modules, organize by level" but there was previously
      nowhere to put a file. Accepts a `/public` path or a Drive link.
      ⚠️ `public/` is world-readable — fine for `free: true`, Drive-with-restricted-
      sharing for paid modules until the real upload platform exists.
- [x] **First real student material wired**: Course Note 01, Credit Foundations
      (`/notes/L1-01-credit-foundations-note.pdf`). `/admin` now names the missing
      assets per module, which is Maui's "report missing items" step.
- [x] `TESTING.md` — the Workflow 1 chain as a printable seven-link runbook with all six
      interest branches, so rehearsals do not depend on anyone remembering the chain.

**🔴 Blocking, still unowned in the tracker**
- [ ] **Domain + DNS access** — Aug 23 QR lock and Maui's Aug 24 print both depend on it,
      and no tracker row assigns it. Escalate to Felicia. **Oldest open item.**
- [ ] **Thank-you redirect** — can Jake's GHL form redirect to our `/thanks`? If not, the
      page is never seen and task 5 changes shape. One answer from Jake settles it.
- [ ] **Jake's form embed URL.** His draft funnel is a `vibepreview.com` preview host —
      usable as a cold standby (`STANDBY_FUNNEL_URL`), never as the printed destination.

**Waiting on others**
- [ ] Offer + pricing approval (Surpaul, tracker due Aug 17)
- [ ] Founding member wording + scholarship rules (Surpaul) — §9
- [ ] Refund / cancellation policy (Surpaul + attorney) — §1, must not be published early
- [ ] Event time + location (Felicia) — §3, placeholders already in `src/content/event.ts`
- [ ] Official social accounts (Felicia) — §12, slots reserved in `src/content/site.ts`
- [ ] Beast's 1:1 booking link (Jake) — CTA on `/thanks` stays hidden until it arrives
- [ ] Attorney legal copy for `legal` in `src/content/site.ts`
- [ ] **Vector logo files (Maui / Felicia)** — both supplied assets are raster. The hero
      piece came from a 1024px JPEG, which is fine on screen but marginal for a large
      table sign. Needed before Maui's Aug 24 print run.

**Build**
- [x] `/` website built to package p.5 spec
- [x] `/830` event page built to package p.7 + Felicia §2 spec
- [x] Content + config extracted to `src/content` / `src/config`
- [x] `/go/[code]` redirect + QR generator
- [x] `/thanks` page built to Felicia §11 hierarchy
- [x] Campaign parameter passthrough into Jake's form
- [x] Membership + pricing configuration layer
- [ ] Vercel project under client ownership, preview URL to Jake ← **next action**
- [ ] Device + cellular test matrix
- [ ] Handoff folder contribution
