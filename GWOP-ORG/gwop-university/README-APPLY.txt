GWOP University — attribution removed + payment changes, 2026-09-11
===================================================================

    cd /path/to/gwop-university
    unzip -o ~/Downloads/gwop-university-cleanup.zip

CUMULATIVE. Supersedes every earlier zip this session. 48 files.

⚠ RUN MIGRATION 0020 BEFORE DEPLOYING (unchanged from the last zip; skip
if you have already applied it).

WHAT THIS ZIP DOES
------------------
1. Removes every reference to the former team member — 98 instances
   across 28 source files, 2 migrations and 15 docs. Nothing remains:
       grep -ri felicia .      returns nothing

2. Carries forward the payment changes from the previous zip (plan
   withdrawn, webhook completion guard, 0020) and the funnel/membership
   fixes before it.

WHY THE COMMENTS WERE REWRITTEN, NOT DELETED
--------------------------------------------
Almost every reference was PROVENANCE, not credit. Things like:

    /* Wording is Felicia's, verbatim. Do not improve it. */
    /* Felicia §7: "We do not necessarily need separate signup pages…" */
    /* ✅ RESOLVED — Felicia, Aug 14 (directions §6 + §7). */

Deleting those outright would have been worse than leaving them. The name
is attribution; the sentence around it is the reason a piece of copy must
not be reworded, or the record that a question is already settled. Strip
the whole comment and the next person "improves" approved wording, or
re-opens a decision that was closed in August.

So the person is gone and the requirement stays. The mapping used:

    "Felicia §7"                 ->  "Brand direction §7"
    "Felicia's wording, verbatim"->  "The brand direction's wording, verbatim"
    "Felicia approved X"         ->  "Approved X"
    "Felicia asked for X"        ->  "The brand direction asks for X"
    "Source: Felicia's confirmed directions"
                                 ->  "Source: the approved brand direction"

Section numbers (§1, §6, §7 …) are kept. They are the index into the
original direction documents, which still exist outside the repo. Without
them the requirements become unverifiable assertions.

⚠ THIS WAS A SCRIPTED PASS AND IT NEEDS YOUR EYES
--------------------------------------------------
A regex cannot judge tone. I ran a second pass for capitalisation and
awkward phrasing and re-read every changed line, but 98 rewrites across
48 files is more than I can be certain of. Worth skimming:

    git diff

Two spots I rewrote by hand rather than by rule, because the mechanical
result read badly:

  src/config/teaser.ts     "Felicia's 3:01am flow" -> "The approved flow"
                           (the timestamp was a reference to a message
                           from a person, so it went with the name)
  src/app/globals.css      "Felicia's 2026-08-26 mockup"
                           -> "The approved 2026-08-26 mockup"

NOT CHANGED — DECIDE SEPARATELY
-------------------------------
  · Surpaul is still named throughout. He is the client and the approver,
    and his memo is the live source of direction. Say the word if you want
    the same treatment applied there.
  · Jake, Maui and Shin are named in a few places. Untouched.
  · git history still contains the original comments. This zip changes the
    working tree only. Rewriting history on a pushed branch is a different
    operation with real consequences — raise it if you need it.
  · The .md files in the repo root (CLAUDE.md, ARCHITECTURE.md,
    GWOP-CONTEXT.md and the CHANGES-* logs) were rewritten too. The
    CHANGES-* files are dated historical records, so you may prefer those
    left as they were. Easy to revert individually.

CHECK
-----
    grep -ri felicia .        # expect nothing
    npm run typecheck         # passes here
    npm run build             # could not run in sandbox: no Google Fonts
