/* ═══════════════════════════════════════════════════════════════════════════
   THE 4-STAGE PATHWAY  —  OWNER: MAUI  ·  APPROVED BY: SURPAUL
   Source: GWOP_Visual_Build_Package.pdf p.4 + p.5, superseded 2026-09-03 by
   Surpaul's stage mockup, extended 2026-09-07 by the approved funnel layout.

   ⚠ RENAMED FROM LEVELS TO STAGES, 2026-09-03. Freshman / Sophomore / Junior /
   Senior became Stage 01–04, with new goal lines. The academic naming implied a
   cohort and a calendar; stages describe a sequence someone works through at
   their own pace, which is what the product actually is.

   ⚠ AND THEN THE LEVEL TITLES CAME BACK, 2026-09-07 — BOTH NOW RENDER.
   Surpaul's final-direction memo says "Stages will be removed and levels will
   be used now" and names them:

     Level 1 — Personal Credit
     Level 2 — Business Foundation & Business Credit
     Level 3 — Funding & Banking Strategy
     Level 4 — Execution, Capital & Wealth Strategy

   But the approved funnel layout renders BOTH on every card: "Stage 01 ·
   Foundation" above "Level 1 — Personal Credit". So `levelTitle` was ADDED
   rather than replacing `label`, and nothing was renamed. That is the only
   change here that is safe to make on a developer's own judgement — a rename
   is not, for the reason below.

   ⚠ THESE NAMES EXIST IN TWO PLACES. This file feeds the marketing surfaces —
   homepage cards, /830, the footer, the membership plan cards. The student
   portal reads them from the `university_levels` table via /api/v1/catalog.
   Migration 0012 moved both together. Edit one without the other and the
   public site and the student area will disagree about what the stages are
   called. If Surpaul wants the stage labels dropped entirely, that is a
   migration plus a copy edit plus Jake updating any GHL condition that matches
   on a stage name — not a one-file change.

   ⚠ DO NOT CHANGE `slug` OR ORDER. The slugs are load-bearing in four places:
   the `level_slug` Postgres enum, the /app/[level] URLs, the course slugs
   seeded in migration 0007 (freshman-foundation, sophomore-readiness, …), and
   the SKUs (GWOPU-FRESHMAN). Renaming them is an enum migration plus a URL
   break plus a commerce change — not a copy edit. A display name and a slug
   are allowed to differ; that is what `label` and `levelTitle` are for.
   ═══════════════════════════════════════════════════════════════════════════ */
export const PATHWAY = [
  /* `label · role` is what renders on the card, e.g. STAGE 01 · FOUNDATION.
     `goal` is the line underneath. `levelTitle` is Surpaul's memo naming, from
     the approved funnel layout. `detail` is unchanged from p.4. */
  { slug: 'freshman',  n: 1, label: 'Stage 01', role: 'Foundation',
    goal: 'Earn the Game',
    levelTitle: 'Level 1 — Personal Credit',
    detail: 'Credit · cash flow · banking · debt' },
  { slug: 'sophomore', n: 2, label: 'Stage 02', role: 'Readiness',
    goal: 'Get in Position',
    levelTitle: 'Level 2 — Business Foundation & Business Credit',
    detail: 'Business setup · records · funding readiness' },
  { slug: 'junior',    n: 3, label: 'Stage 03', role: 'Build + Scale',
    goal: 'Get Funded & Build',
    levelTitle: 'Level 3 — Funding & Banking Strategy',
    detail: 'Revenue · capital · systems · protection' },
  { slug: 'senior',    n: 4, label: 'Stage 04', role: 'Legacy',
    goal: 'Get with GWOP Plan',
    levelTitle: 'Level 4 — Execution, Capital & Wealth Strategy',
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
