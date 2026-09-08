/* ═══════════════════════════════════════════════════════════════════════════
   THE 4-LEVEL PATHWAY  —  OWNER: MAUI  ·  APPROVED BY: SURPAUL
   Source: Surpaul's final-direction memo. Supersedes the 2026-09-03 stage
   mockup entirely.

   ⚠ STAGES ARE GONE, 2026-09-08. Do not reintroduce them.

   The history, because it has now turned over twice and somebody will
   otherwise "restore" the middle version:

     p.4/p.5   Freshman / Sophomore / Junior / Senior — academic naming
     09-03     became Stage 01-04 with goal lines, per Surpaul's mockup
     09-08     Stages removed. Surpaul: "Stages will be removed and levels
               will be used now." Level 1-4 with the titles below.

   The academic names implied a cohort and a calendar. The stage names lost
   what each level is actually about. The level titles say both — the position
   in the sequence and the subject.

   ⚠ THE GOAL LINES SURVIVE. "Earn the Game", "Get in Position", "Get Funded &
   Build", "Get with GWOP Plan" came from the 09-03 mockup and are Surpaul's
   words. They are not stage names, so they stay — they are the line that gives
   each level its voice, and nothing in his memo replaces them.

   ⚠ THIS RENAME IS NOT COMPLETE IN THIS FILE ALONE. These names live in two
   places: this file feeds the marketing surfaces, and the student portal reads
   them from `university_levels` via /api/v1/catalog. Migration
   0013_level_rename.sql moves the database in the same commit. Ship them
   together or the public site and the student area will disagree about what
   the levels are called — which is exactly what happened for a day in
   September.

   ⚠ AND `role` IS GONE TOO. Foundation / Readiness / Build + Scale / Legacy
   were the second half of the stage label ("Stage 01 · Foundation"). With the
   level titles naming the subject directly, a role word alongside them is a
   third name for the same thing.

   ⚠ DO NOT CHANGE `slug` OR ORDER. The slugs are load-bearing in four places:
   the `level_slug` Postgres enum, the /app/[level] URLs, the course slugs
   seeded in migration 0007 (freshman-foundation, sophomore-readiness, …), and
   the SKUs (GWOPU-FRESHMAN). Renaming them is an enum migration plus a URL
   break plus a commerce change — not a copy edit. A display name and a slug
   are allowed to differ; that is the whole point of `label`.
   ═══════════════════════════════════════════════════════════════════════════ */
export const PATHWAY = [
  /* `label · role` is what renders on the card, e.g. STAGE 01 · FOUNDATION.
     `goal` is the line underneath. `detail` is unchanged from p.4. */
  /* `label` is the short form for cards and breadcrumbs. `title` is the full
     name from Surpaul's memo. `goal` is his line underneath.

     ⚠ `title` MAPS TO university_levels.role_label IN THE DATABASE. There is
     no `title` column — that field held the second half of the stage label
     ("Foundation") and now holds the subject ("Personal Credit"). Same value,
     two names, joined by /api/v1/catalog. Rename one and you must rename the
     other; see 0013_level_rename.sql. */
  { slug: 'freshman',  n: 1, label: 'Level 1',
    title: 'Personal Credit',
    goal: 'Earn the Game',
    detail: 'Credit · cash flow · banking · debt' },
  { slug: 'sophomore', n: 2, label: 'Level 2',
    title: 'Business Foundation & Business Credit',
    goal: 'Get in Position',
    detail: 'Business setup · records · funding readiness' },
  { slug: 'junior',    n: 3, label: 'Level 3',
    title: 'Funding & Banking Strategy',
    goal: 'Get Funded & Build',
    detail: 'Revenue · capital · systems · protection' },
  { slug: 'senior',    n: 4, label: 'Level 4',
    title: 'Execution, Capital & Wealth Strategy',
    goal: 'Get with GWOP Plan',
    detail: 'Assets · investing · estate · long-term wealth' },
] as const

export const CAPSTONE = 'Capstone: The Completed GWOP Blueprint'

/* Section heading and lede for the pathway block, from the same mockup.
   Previously hardcoded inside /830 as "Four levels, in order." with "Each one
   has a clear purpose and a clear outcome." Sourced here because the copy is
   rendered on more than one surface and drifted once already. */
export const PATHWAY_HEADING = 'Four levels. One plan.'
export const PATHWAY_LEDE =
  "The order isn't arbitrary — each level has to hold before the next one works."
