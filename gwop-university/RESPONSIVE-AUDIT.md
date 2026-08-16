# Responsive audit — findings and fixes

Audited: every route, 280px to 1920px. Seven defects found, all fixed.

---

## Defects found

### 1 · Breadcrumb overflowed on narrow screens 🔴
`.crumb` was `display:flex` with no `flex-wrap`. On
`/app/freshman/credit-foundations` the trail reads
`STUDENT AREA › FRESHMAN › CREDIT FOUNDATIONS` — uppercase and letterspaced,
about 380px wide. At 320px it pushed the page sideways.

**Fix:** `flex-wrap:wrap` with a smaller row gap. Now wraps to two lines.

### 2 · Module rows could not shrink 🔴
`.mod` used `grid-template-columns:auto 1fr auto`. A `1fr` track will not go
below its content width, so a long title — *"Bank Relationships and Funding
Readiness"* — widened the whole row.

**Fix:** `auto minmax(0,1fr) auto`. `minmax(0,…)` is what actually permits a
track to shrink; `1fr` alone does not.

### 3 · Interest buttons were two-up at 320px 🔴
`.evpicks` was `1fr 1fr` in the base layer, so two columns on every phone. At
320px each column left roughly 69px for the label, and
*"Business / Entrepreneurship"* shredded across four lines.

**This is the most important control on the event page** — the CHOOSE step of
the scan-to-signup flow.

**Fix:** single column by default, two-up from 400px where a column can hold
the longest label.

### 4 · Grid tracks throughout could not shrink 🟡
Six more grids used bare `1fr` — course cards, footer columns, gift rows,
admin stats. Same latent bug as #2, waiting on longer content.

**Fix:** `minmax(0,1fr)` everywhere.

### 5 · Three media queries to express one rule 🟡
The homepage hero split into two columns at 820px, was reset to one column by a
second query between 820–1009, then split again at 1010. The middle query
existed only to undo the first.

**Fix:** the split now starts at 1010, where there is genuinely room. The
intermediate query is gone.

### 6 · Nowrap labels with no escape 🟡
`.mod .go`, `.chip` and `.lvlhead .cnt` were `white-space:nowrap` with no
overflow handling. An `auto` grid track sized by nowrap text does not yield, so
the title column paid for it.

**Fix:** `text-overflow:ellipsis` as a floor, and below 400px the module row
drops its trailing "Open ›" entirely — the whole row is already a link, so the
label was a redundant affordance eating the title's space.

### 7 · Dead CSS 🟡
Comments and rules referencing the sticky header, mobile drawer and backdrop
blur — all removed components. Noise that reads as active code.

**Fix:** removed.

---

## The safety net

Added once, rather than per-instance:

```css
.courses > *, .evgifts > *, .stats > *, .mods > *,
.fg > *, .mod > *, .evgift > *, .lvlhead > * { min-width: 0 }
```

Grid and flex items default to `min-width:auto`, meaning they refuse to shrink
below their content. One long word, one wide image or one nowrap label then
pushes the row past the viewport — and because the overflow originates in a
child, nothing in the parent's CSS looks wrong.

This is the single most common cause of sideways scrolling on phones. Setting
`min-width:0` on the containers that hold variable-length content fixes the
class of bug rather than each instance of it.

---

## Breakpoint scale

Reduced from 15 to 12, documented at the top of `globals.css`. Each exists
because content breaks there, not because a device does — which is why they are
not 375/768/1024.

| Breakpoint | Why |
|---|---|
| ≤339 | Fold cover screens, oldest Androids |
| ≤399 | Smallest phones: full-width CTAs, smaller artwork, module label hidden |
| ≥400 | Interest buttons fit two-up |
| ≤439 | Hero and event CTAs go full width |
| ≥520 | Course cards go two-up |
| ≥640 | Three-up rows |
| ≥720 | Event hero splits |
| ≥820 | Larger headline, artwork sized to column |
| ≥1010 | Homepage hero splits |
| ≥1024 | Four-up rows, widest footer |
| max-height 520 | Landscape phones |
| reduced-motion | Accessibility |

Mobile-first: base styles are the phone layout and `min-width` adds to it.
`max-width` appears only where a rule must be *removed* on small screens.

---

## Width budget

Longest content against the narrowest viewports, after fixes:

| Content | 320px | 280px |
|---|---|---|
| Breadcrumb segment | fits | fits |
| Module title | wraps to 2 lines | fits |
| Interest label | fits | wraps to 2 lines |

Wrapping is fine — the containers have flexible height. Overflow is not, and
there is none.

---

## Still requires real hardware

Static analysis catches structural defects, and it caught seven. It cannot tell
you whether something *feels* right. Outstanding:

- [ ] iPhone, Safari — the only engine that matters on iOS
- [ ] Android, Chrome — different font rendering and viewport handling
- [ ] One phone in landscape
- [ ] `/830` on cellular with wifi off, since that is the event-day condition
- [ ] Any page with the GHL form embedded — third-party iframes have their own
      height behaviour and are the most likely remaining source of clipping
