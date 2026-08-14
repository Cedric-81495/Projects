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
| Scans from ~1 metre (staff holding a card) | ☐ |
| `/go/1` … `/go/5` each reach `/830` with the right `?s=` role | ☐ |
| An unknown code (e.g. `/go/99`) still lands on `/830` — never a 404 | ☐ |
| Plain-text backup link works when typed by hand | ☐ |

A dead QR at the booth is unrecoverable. That is why the printed code points at
`/go/[code]` and never at `/830`.

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
