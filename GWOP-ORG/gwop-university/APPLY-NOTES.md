# GWOP University — changes, 2026-09-11

    cd /path/to/gwop-university
    unzip -o ~/Downloads/gwop-university-cleanup.zip

Cumulative — supersedes every earlier zip. 48 files.

⚠ **Run migration 0020 before deploying** (skip if already applied).

⚠ **Delete this file after applying.** It belongs in your Downloads, not the
repo. The last zip left a `README-APPLY.txt` in your project root by mistake.

    rm APPLY-NOTES.md

---

## 1 · Scholarship removed

Surpaul's instruction: he did not originate it, was not aware of it, and does
not want it offered. Deleted from three places:

- `config/membership.ts` — the `OFFERS.scholarship` block
- `config/membership.ts` — the `CAPABILITIES.scholarshipGiveaway` flag
- `content/event.ts` — the "Scholarship Opportunity / Sign up to be entered"
  item, and the heading count above it, now "Two things you get."

**It was never rendered.** `incentives` has no reader anywhere in `src/`.
But every item in that block carried `pending: false`, which marks it as
approved and ready to publish — so wiring `incentives` up would have put an
undefined giveaway on a live page with no terms behind it. Deleted rather
than left with a warning comment, for that reason.

**One thing the deletion does not close.** At least one person signed up on
event day under wording that told them they were entered. That promise is
outstanding regardless of what the code says. It is recorded in the removal
note in `config/membership.ts` and in `CLAUDE.md`, so it does not vanish with
the last line of scholarship code. It is Surpaul's to settle.

**Not touched:** `enrollment_source` in `0001_foundation.sql` includes a
`'scholarship'` value. It is an unused enum member, and dropping a value from
a Postgres enum requires recreating the type and every column using it. Not
worth the migration for a value nothing writes. Say the word if you want it
gone anyway.

## 2 · Former team member attribution removed

98 references across 28 source files, 2 migrations and 15 docs.
`grep -ri felicia .` returns nothing.

Rewritten, not deleted. Nearly all were provenance — which copy is approved
verbatim, which questions were resolved and when. Stripping the comments
outright would let someone rework approved wording or reopen a settled
decision with nothing recording that it was settled.

    "Felicia §7"          ->  "Brand direction §7"
    "Felicia approved X"  ->  "Approved X"
    "Felicia asked for X" ->  "The brand direction asks for X"

Section numbers kept — they index the original direction documents, which
exist outside the repo.

⚠ **Scripted pass. Skim `git diff` before committing.** A regex cannot judge
tone. I ran a second pass for capitalisation and read every changed line, but
98 rewrites across 48 files is more than I can be certain of.

**Not changed, decide separately:** Surpaul, Jake, Maui and Shin are still
named. Git history still holds the original comments — this changes the
working tree only.

## 3 · Payment plan withdrawn + webhook guard

Carried forward from the previous zip. The 3 × $397 option is off every
surface — it was showing a price with nothing behind it. And
`customer.subscription.deleted` can no longer revoke access from a buyer who
finished paying. Full reasoning in `config/membership.ts` under
`BLUEPRINT_BUNDLE` and at the foot of `0020_instalment_counters.sql`.

## Check

    grep -ri felicia .        # expect nothing
    grep -ri scholarship src/ # only the removal notes
    npm run typecheck         # passes here
    npm run build             # could not run in sandbox: no Google Fonts
