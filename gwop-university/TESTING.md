# TESTING — the Workflow 1 chain

Workflow 1's **TEST EVERYTHING TOGETHER** row, made runnable. Seven links. Test them in
order; a failure at link *n* makes every result after it meaningless.

```
QR CODE → LANDING PAGE → SIGNUP FORM → GOHIGHLEVEL → TEXT + EMAIL → MODULES → READY
  Jhon        Jhon           Jake          Jake          Jake      Shin/Maui   Jhon runs
```

Print this. Fill it in by hand during a rehearsal. Six runs per rehearsal — one per interest
plus one skip. **Rehearsals: Aug 25 and Aug 26.**

---

## Before you start

- [ ] Test-lead marker agreed with Jake — suggest first name `ZZTEST`, so every test lead
      can be found and deleted with one filter
- [ ] Real US phone numbers you control. A2P is live, so these are real billable messages
- [ ] Wifi **off**. Cellular only. The booth will not have good wifi
- [ ] A **printed** QR at final size — not a screenshot on a laptop

---

## 1 · QR CODE → page opens

| Check | Pass |
|---|---|
| Printed QR scans at arm's length, dim light, first try | ☐ |
| The code on the table sign and the counter card are the SAME code | ☐ |
| The airdrop graphic opens the page with no QR on it (p.6 piece 3) | ☐ |
| Scans from ~1 metre (staff holding a card) | ☐ |
| `/go/1` … `/go/5` each reach `/830` with the right `?s=` role | ☐ |
| An unknown code (e.g. `/go/99`) still lands on `/830` — never a 404 | ☐ |
| Plain-text backup link works when typed by hand | ☐ |

A dead QR at the booth is unrecoverable. That is why the printed code points at
`/go/[code]` and never at `/830`.

## 1b · SCREEN SIZES

Breakpoint behaviour, verified statically. Column counts are what the CSS
resolves to at each width:

| Width | Course cards | Hero | Event hero | Devices |
|---|---|---|---|---|
| 280-339 | 1 | stacked | stacked | Fold cover screen, old Androids |
| 340-519 | 1 | stacked | stacked | iPhone SE/13/15, most Androids |
| 520-719 | 2 | stacked | stacked | Large phones, Fold open |
| 720-819 | 2 | stacked | side by side | iPad mini portrait |
| 820-1009 | 2 | stacked | side by side | iPad / iPad Air portrait |
| 1010-1023 | 2 | side by side | side by side | Small laptop windows |
| 1024+ | 4 | side by side | side by side | iPad landscape, desktop |

Also handled: viewports under 520px tall (landscape phones) shrink the drawer
so the whole menu fits; `viewport-fit=cover` plus safe-area insets keep the menu
clear of the notch and home indicator.

**Statically verified ≠ tested.** The table above says what the CSS resolves to.
It does not tell you whether it *looks* right, whether tap targets feel right, or
how it behaves on cellular. Those still need real hardware — the checks below.

### Devices to actually test on

| Device | Why this one |
|---|---|
| iPhone (any current) | Safari is the only engine that matters on iOS |
| Android phone, Chrome | Different font rendering and viewport handling |
| One small phone (≤375px) | Where the headline and CTA compete for space |
| One phone in landscape | The drawer scroll fix above |
| iPad or tablet | The 2-column band nobody looks at |

Check on each: no horizontal scroll at any point, headline and CTA visible
without scrolling, buttons comfortably tappable one-handed, images sharp, and
the page readable in bright outdoor light.

## 2 · LANDING PAGE

| Check | Pass |
|---|---|
| Loads under 2s on cellular | ☐ |
| Headline and the CTA are visible without scrolling | ☐ |
| No horizontal scroll on the narrowest phone you have | ☐ |
| Every tap target reachable one-handed, ≥44px | ☐ |
| Nothing clickable leads away except Privacy / Terms / SMS Terms | ☐ |
| Reads in bright light (venue lighting is harsh) | ☐ |

## 3 · SIGNUP FORM — needs Jake

| Check | Pass |
|---|---|
| Form loads inside the page, no pinch-zoom needed | ☐ |
| Keyboard does not cover the submit button | ☐ |
| Phone field opens a numeric keypad | ☐ |
| Consent checkboxes present and unticked by default | ☐ |
| Submits on cellular without error | ☐ |

## 4 · GOHIGHLEVEL — needs Jake

Per lead, confirm in GHL:

| Field | Expected |
|---|---|
| Source tag | `EVENT - Everybody Gotta Eat - 08/30/26` |
| Interest tag | matches what was tapped (see the six branches below) |
| QR source | the booth role from `?s=` |
| Campaign | any `utm_*` present in the scanned link |
| Pipeline | New Lead stage |
| Duplicate | a second submit with the same phone updates, not duplicates |

## 5 · TEXT + EMAIL — needs Jake

| Check | Pass |
|---|---|
| SMS arrives. Note the delay in seconds → ______ | ☐ |
| Email arrives — **and check the spam folder** | ☐ |
| Reply STOP works, and confirms | ☐ |
| Correct Blueprint for the interest chosen | ☐ |

The email's spam folder is the real test of whether the DNS authentication records are in
place. If it lands in spam, that is a domain problem, not a copy problem.

## 6 · MODULES — needs Maui

| Check | Pass |
|---|---|
| A module opens and plays on a phone | ☐ |
| Correct level, correct order | ☐ |
| No missing or broken files | ☐ |

## 7 · READY FOR EVENT

| Check | Pass |
|---|---|
| All six branches passed end to end | ☐ |
| Tested on iOS Safari **and** Android Chrome | ☐ |
| Standby switch rehearsed — re-point `/go/[code]`, booth keeps running | ☐ |
| Test leads deleted from GHL | ☐ |

---

## The six branches

Five interests plus the skip. **All six must be tested** — the sixth is the one that gets
forgotten, and at a busy booth a real number of people will not categorise themselves.

| Tapped | `interest` sent | `interest_tag` sent | Pass |
|---|---|---|---|
| Credit | `credit` | `Credit` | ☐ |
| Business Funding | `funding` | `Business Funding` | ☐ |
| Business / Entrepreneurship | `entrepreneurship` | `Entrepreneurship` | ☐ |
| Wealth Building | `wealth` | `Wealth Building` | ☐ |
| Wellness | `wellness` | `Wellness` | ☐ |
| "Not sure yet" (skip) | `unspecified` | `Unspecified` | ☐ |

---

## Log every run

Copy this row per submission. This log is the handoff evidence on Aug 27 — an untested
claim is not a pass.

```
date | tester | device | OS | browser | network | booth code | interest |
page load s | SMS delay s | email? | spam? | correct blueprint? | PASS/FAIL | notes
```

## Fast local checks

```bash
pnpm build && pnpm start -H 0.0.0.0   # then open the Network URL on a real phone
pnpm typecheck                        # must be clean
pnpm qr                               # regenerate QR files into qr-out/
```

Routes to spot-check by hand: `/` `/830` `/thanks` `/go/1` `/go/99` `/privacy` `/terms`
`/sms-terms` `/refunds` `/disclosures` `/app` `/admin`
