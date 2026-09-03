/* ═══════════════════════════════════════════════════════════════════════════
   THE 4-STAGE PATHWAY  —  OWNER: MAUI  ·  APPROVED BY: SURPAUL
   Source: GWOP_Visual_Build_Package.pdf p.4 + p.5, superseded 2026-09-03 by
   Surpaul's stage mockup.

   ⚠ RENAMED FROM LEVELS TO STAGES, 2026-09-03. Freshman / Sophomore / Junior /
   Senior became Stage 01–04, with new goal lines. The academic naming implied a
   cohort and a calendar; stages describe a sequence someone works through at
   their own pace, which is what the product actually is.

   ⚠ THESE NAMES EXIST IN TWO PLACES. This file feeds the marketing surfaces —
   homepage cards, /830, the footer, the membership plan cards. The student
   portal reads them from the `university_levels` table via /api/v1/catalog.
   Both were changed together (see migration 0012). Edit one without the other
   and the public site and the student area will disagree about what the stages
   are called.

   ⚠ DO NOT CHANGE `slug` OR ORDER. The slugs are load-bearing in four places:
   the `level_slug` Postgres enum, the /app/[level] URLs, the course slugs
   seeded in migration 0007 (freshman-foundation, sophomore-readiness, …), and
   the SKUs (GWOPU-FRESHMAN). Renaming them is an enum migration plus a URL
   break plus a commerce change — not a copy edit. A display name and a slug are
   allowed to differ; that is what `label` is for.
   ═══════════════════════════════════════════════════════════════════════════ */
export const PATHWAY = [
  /* `label · role` is what renders on the card, e.g. STAGE 01 · FOUNDATION.
     The `role` values are unchanged — Foundation, Readiness, Build + Scale and
     Legacy were already right and the mockup keeps them. Only `label` and
     `goal` moved. `detail` is unchanged too. */
  { slug: 'freshman',  n: 1, label: 'Stage 01', role: 'Foundation',
    goal: 'Earn the Game',
    detail: 'Credit · cash flow · banking · debt' },
  { slug: 'sophomore', n: 2, label: 'Stage 02', role: 'Readiness',
    goal: 'Get in Position',
    detail: 'Business setup · records · funding readiness' },
  { slug: 'junior',    n: 3, label: 'Stage 03', role: 'Build + Scale',
    goal: 'Get Funded & Build',
    detail: 'Revenue · capital · systems · protection' },
  { slug: 'senior',    n: 4, label: 'Stage 04', role: 'Legacy',
    goal: 'Get with GWOP Plan',
    detail: 'Assets · investing · estate · long-term wealth' },
] as const

export const CAPSTONE = 'Capstone: The Completed GWOP Blueprint'

/* Section heading and lede for the pathway block, from the same mockup.
   Previously hardcoded inside /830 as "Four levels, in order." with "Each one
   has a clear purpose and a clear outcome." Sourced here because the copy is
   rendered on more than one surface and drifted once already. */
export const PATHWAY_HEADING = 'Four stages. One plan.'
export const PATHWAY_LEDE =
  "The order isn't arbitrary — each stage has to hold before the next one works."
