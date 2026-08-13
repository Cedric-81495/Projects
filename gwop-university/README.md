# GWOP University — Website + Event Experience

**Owner:** Jhon (Website + App) · **Event:** Aug 30, *Everybody Gotta Eat*
**Handoff to U.S. team:** Aug 27 · **Read `CLAUDE.md` before changing anything**

---

## Run it

```bash
pnpm install
cp .env.example .env.local     # fill in the two values
pnpm dev                       # http://localhost:3000
pnpm build                     # must pass before any push
pnpm typecheck                 # must be clean
pnpm qr                        # regenerate QR codes into qr-out/
```

## Routes

| Route | What it is | Tracker task |
|---|---|---|
| `/` | Website — brand, pathway, materials, enrollment | — |
| `/830` | **Event landing page — the QR destination** | 1, 2, 4 |
| `/thanks` | Confirmation after Jake's form submits | 5 |
| `/go/[code]` | **Redirect the printed QR points at** | 7 |
| `/privacy` `/terms` `/disclosures` | Awaiting attorney copy | — |
| `/app` | Student app — Phase 2 stub | — |

---

## Who edits what

**This is the handoff contract.** The Visual Build Package standard: *"If a file cannot be
handed directly to the next person and used, it is not finished."*

| File | Who | Contains |
|---|---|---|
| `src/content/site.ts` | Surpaul / Felicia → applied by Maui | All website copy |
| `src/content/event.ts` | Surpaul (offer) / Maui | Event page copy, incentives, thank-you |
| `src/content/pathway.ts` | Maui | Freshman–Senior labels and details |
| `src/config/integrations.ts` | **Jhon**, input from Jake | Form URL, QR codes, interests, draft flag |
| `src/app/globals.css` | **Jhon only** | Design tokens + all styling |
| `src/app/**/*.tsx` | **Jhon only** | Structure. **Never copy.** |

### Changing copy — no developer needed

Open the relevant file in `src/content/`, edit the text between the quotes, save. Nothing
else. Copy never lives inside a component.

### `pending: true`

Marks a value as unconfirmed. While `DRAFT` is on, those values are highlighted on the page
and listed in the red bar at the bottom. **Clear every `pending` before setting
`DRAFT = false` in `src/config/integrations.ts`.**

---

## Connecting Jake's form (task 3)

1. Get the embed URL from Jake — usually `https://api.leadconnectorhq.com/widget/form/XXXX`
2. Put it in `.env.local` as `NEXT_PUBLIC_GHL_FORM_URL`
3. Submit a test lead and confirm with Jake that it lands in GHL with the right tag,
   pipeline and `interest` value

The page passes two parameters into his form:

- `interest` — what the attendee tapped (`credit`, `funding`, …, or `unspecified`)
- `s` — which printed QR they scanned (`greeter`, `ambassador`, …)

**Jake needs one nurture branch per interest value, plus a default for `unspecified`.**

---

## QR codes (task 7) — read this before printing

The printed QR encodes **`/go/1`**, never `/830`.

```
printed QR → gwopu.com/go/2 → /830?s=greeter
```

That redirect is the only way to change the destination after printing. To re-point every
printed code, change `EVENT_PATH` in `src/config/integrations.ts` — nothing reprints.

```bash
NEXT_PUBLIC_SITE_URL=https://gwopu.com pnpm qr
```

Produces, per booth role: `-print.png` (2400px, signage), `-tabletop.png` (1200px),
`-card.png` (600px), plus SVG.

**Before Aug 23:** field-test an actually printed code — dim light, one metre, iOS and
Android. Give Maui **one URL in writing** plus the plain-text backup link for the booth
card, for phones whose camera won't focus.

**Never use a third-party QR generator.** If the service expires or starts charging, every
printed code in the room is dead and nothing can be done.

---

## Before handoff (Aug 27)

- [ ] `pnpm build && pnpm typecheck` clean
- [ ] `NEXT_PUBLIC_GHL_FORM_URL` set in Vercel production
- [ ] Every `pending: true` cleared, `DRAFT = false`
- [ ] Attorney copy pasted into `/privacy`, `/terms`, `/disclosures`
- [ ] Vector crest replacing the placeholder in the hero
- [ ] All five interests submit and route correctly (confirmed by Jake)
- [ ] Thank-you page reached by a real submit
- [ ] iPhone + Android + **cellular** test matrix logged
- [ ] Printed QR field-tested
- [ ] Vercel project owned by the client, Jhon as admin

---

## Known constraints

- **Fonts load from Google in preview.** Self-host and subset before production.
- **First Load JS is ~105kB** — that's the Next.js baseline. `/830` is statically
  prerendered so the CDN serves HTML+CSS immediately; JS is deferred and doesn't block the
  form.
- **`/830` is `noindex`.** Intentional.
- **No database, no auth, no API routes that accept data.** Jake's form is the system of
  record. If a change appears to need a backend, re-read `CLAUDE.md` §3.

---

## UI/UX build — verified

Strictly the Visual Build Package. Sections the package does not specify were removed.

| Route | Package reference |
|---|---|
| `/` | p.5 hero (black card, "Knowledge Pays.", START YOUR BLUEPRINT, logo right) + four course cards with gold `ENTER ›` · p.4 pathway (alternating emerald/forest bars, gold numbers, capstone) |
| `/830` | p.7 event table hero · p.6 SCAN → CHOOSE → CAPTURE |
| `/app`, `/app/[level]`, `/app/[level]/[module]` | p.5 card system · p.3 workbook standard |
| `/admin` | Maui's tracker tasks: organise by level, flag missing assets |

### Responsive — tested, not assumed

Audited at **320 / 390 / 430 / 768 / 1024 / 1280 / 1600px** across all six pages:

- No horizontal overflow at any width
- Drawer fills the viewport at every mobile width
- Nav switches to desktop at exactly 1024px
- Tap targets ≥44px except breadcrumb and inline legal links

Bugs found and fixed during the audit:

1. `.drawer::before` decorative ring escaped its fixed container → **70px of horizontal
   scroll on every page under 1024px**
2. `backdrop-filter` on `<header>` created a containing block → the fixed drawer was
   **clipped to the header's 64px height**. The drawer must be a sibling of the header.
3. Header sat *below* the drawer → **the close button was unreachable**
4. Grid rows made the burger→X offsets unreliable (rendered as a chevron) → absolute
   positioning instead
5. `.drawer ul{flex:1}` stretched the level grid → only the CTA block absorbs free space

### Brand assets — naming correction

The 5250×5250 transparent upload is the **secondary** crest (shield · dome · laurel · U),
not the primary logo. Files are named accordingly:

| File | What it is |
|---|---|
| `crest.png/.webp` (1537×1600) | Secondary crest, transparent — hero, nav, favicons |
| `crest-800`, `crest-200` | Responsive sizes |
| `logo-primary-onivory.jpg` | **Primary** logo (tall arch + THE GWOP BLUEPRINT plaque), extracted from the brand sheet — sits on ivory, no transparency |

**Still needed from Maui:** the primary logo as a transparent PNG or vector. The brand sheet
assigns it to hero graphics and course covers, but the only copy available is on an ivory
plate, which cannot sit on the forest hero card. The secondary crest is used there instead.

---

## Security — dependency posture (Aug 14)

**Patched:** `next` was on **15.5.4**, which is vulnerable to **CVE-2025-66478** — a
CVSS 10.0 remote-code-execution flaw in the React Server Components protocol, actively
exploited in the wild. Now on **15.5.23** (latest 15.5 backport). Verified cleared.

**Remaining, accepted for Aug 30:** three high advisories in `postcss` and `sharp`, both
transitive dependencies bundled by Next. `npm audit` only offers a fix by upgrading to
Next **16.3.0**, which is a semver-major jump.

Decision: **stay on 15.5.23 until after the event.**

- `sharp` — libvips image-parsing flaws. Only reachable when processing untrusted images;
  every image here is a static file we control, and image optimisation runs on Vercel's
  infrastructure.
- `postcss` — build-time only, requires an attacker-controlled `sourceMappingURL` in CSS.
  All CSS in this repo is ours.

Neither is reachable by a visitor to a static marketing site. A major-version framework
upgrade seven days before an unrepeatable event is the larger risk.

**After Aug 30:** upgrade to the current Next 16.x, re-run `npm audit`, and re-run the
responsive audit before redeploying.

---

## Data handling — what applies here

This site **stores nothing**. Jake's GoHighLevel form is the system of record, so there is
no database, no session, no logging, and exactly one API route (`/go/[code]`, `GET` only,
a redirect). That removes most of the usual risk — but two things still matter.

### 1 · The `?s=` parameter is user-controllable

The QR redirect puts a source value in the URL, and that value is passed into Jake's form
URL. Anything a visitor can edit is untrusted input.

**Rule: validate against an allow-list, never reflect it.** See `readSource()` in
`src/app/830/InterestForm.tsx` — it accepts only values present in `QR_CODES`, and falls
back to `direct`. It is never rendered into the DOM, only appended to a URL after being
matched against a known set.

```ts
const known = Object.values(QR_CODES) as readonly string[]
return s && known.includes(s) ? s : 'direct'
```

Apply the same pattern to any future param. Never interpolate a raw param into markup,
a URL, or an attribute.

### 2 · We embed a third-party iframe

Jake's form runs code we don't control inside our page. The CSP in `next.config.ts`
constrains it: **`frame-src` is derived from `GHL_FORM_URL`**, so only that exact origin
can be framed. With the variable unset it resolves to `'none'` — meaning it is impossible
to accidentally allow arbitrary framing.

### Headers set (verified in production build)

| Header | Why |
|---|---|
| `Content-Security-Policy` | No third-party script origins; only Jake's origin may be framed |
| `frame-ancestors 'none'` | Our pages can't be embedded elsewhere (clickjacking) |
| `Strict-Transport-Security` | HTTPS only, 2 years |
| `X-Content-Type-Options: nosniff` | No MIME sniffing |
| `Referrer-Policy: strict-origin-when-cross-origin` | The `?s=` value isn't leaked to Jake's domain via referrer |
| `Permissions-Policy` | Camera, mic, geolocation, payment, USB all denied — we need none |

### Standing rules

1. **No endpoint that accepts data.** `CLAUDE.md` invariant 1. If a task seems to need
   one, the answer is a question, not an API route.
2. **No PII in this codebase, ever** — no name, email, phone, SSN, date of birth, address,
   credit report data or card details. Not in code, not in content files, not in logs.
3. **Never display lead data.** If a live signup view is ever added it shows **counts, not
   people**. Names and numbers stay in GHL where the access controls are.
4. **`/admin` is publicly reachable by URL.** It's `noindex` and unlinked, and it holds
   only module titles and status — no personal data. **That is a requirement, not a
   coincidence.** Before it ever displays anything sensitive it must be put behind auth.
5. **No analytics, chat widget or third-party script on `/830` before Aug 27.** Nothing
   goes in front of the form.
6. Course content is **view-only** — signed, expiring links, no download affordance,
   never a public bucket URL (Phase 2).
