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
