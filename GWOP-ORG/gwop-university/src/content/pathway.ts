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
/* ⚠ EXPLICITLY TYPED, not inferred.

   Without this, TypeScript narrows `lessons` to the literal union of whatever
   numbers happen to be in the data today — 4 | 5 | 6 | 7 — and then rejects
   `m.lessons === 1` in the pluralisation as provably false. The data becomes
   its own type, so adding a one-lesson module later would be a compile error
   in a component that never changed.

   Same reasoning for `slug`: it stays a union because the four slugs ARE the
   level_slug enum and a fifth would be a genuine mistake. Lesson counts are
   data; slugs are structure. */
type PathwayLevel = {
  slug: 'freshman' | 'sophomore' | 'junior' | 'senior'
  n: number
  label: string
  title: string
  goal: string
  detail: string
  eyebrow: string
  modules: { title: string; lessons: number }[]
  downloads: string[]
  blueprintSection: string
}

export const PATHWAY: PathwayLevel[] = [
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
    detail: 'Scoring mechanics, disputes, utilization, collections',
    /* Shown as the small caps line above the headline on the funnel card.
       `label` stays short ("Level 1") because the portal nav and PathwayRail
       render it in tight horizontal space. */
    eyebrow: 'Level 1 · Personal Credit',
    modules: [
      { title: 'The Credit Game: What They Never Taught Us', lessons: 6 },
      { title: 'Credit Cleanup & Control', lessons: 6 },
    ],
    downloads: [
      'Credit report review checklist',
      'Credit utilization worksheet',
      'Personal financial inventory',
    ],
    /* Memo §8 — which Blueprint section this level completes. Verbatim from
       his headings; changing them breaks the link between what the page
       promises and what the workbook delivers. */
    blueprintSection: 'WHERE I AM NOW' },
  { slug: 'sophomore', n: 2, label: 'Level 2',
    title: 'Business Foundation & Business Credit',
    goal: 'Get in Position',
    detail: 'Entity, NAICS, banking, business credit profile',
    /* Shown as the small caps line above the headline on the funnel card.
       `label` stays short ("Level 1") because the portal nav and PathwayRail
       render it in tight horizontal space. */
    eyebrow: 'Level 2 · Business Foundation & Business Credit',
    modules: [
      { title: 'The Perfect LLC: Identity & Structure', lessons: 5 },
      { title: 'Business Credit & Fundability Infrastructure', lessons: 4 },
    ],
    downloads: [
      'Business setup checklist',
      'Fundable Profile checklist',
      'Business funding preparation checklist',
    ],
    /* Memo §8 — which Blueprint section this level completes. Verbatim from
       his headings; changing them breaks the link between what the page
       promises and what the workbook delivers. */
    blueprintSection: 'WHERE I NEED TO GO' },
  { slug: 'junior',    n: 3, label: 'Level 3',
    title: 'Funding & Banking Strategy',
    goal: 'Get Funded & Build',
    detail: 'Underwriting psychology, stacking, sequencing, 0% APR',
    /* Shown as the small caps line above the headline on the funnel card.
       `label` stays short ("Level 1") because the portal nav and PathwayRail
       render it in tight horizontal space. */
    eyebrow: 'Level 3 · Funding & Banking Strategy',
    modules: [
      { title: 'Bank Relationships & Underwriting Psychology', lessons: 6 },
      { title: 'The Funding Blueprint: Stacking & Sequencing', lessons: 7 },
    ],
    downloads: [
      'Bank relationship tracker',
      'Funding readiness checklist',
      'Application sequencing worksheet',
    ],
    /* Memo §8 — which Blueprint section this level completes. Verbatim from
       his headings; changing them breaks the link between what the page
       promises and what the workbook delivers. */
    blueprintSection: 'MY FUNDING STRATEGY' },
  { slug: 'senior',    n: 4, label: 'Level 4',
    title: 'Execution, Capital & Wealth Strategy',
    goal: 'Get with GWOP Plan',
    detail: 'Deployment, cash flow, the 90-day execution plan',
    /* Shown as the small caps line above the headline on the funnel card.
       `label` stays short ("Level 1") because the portal nav and PathwayRail
       render it in tight horizontal space. */
    eyebrow: 'Level 4 · Execution, Capital & Wealth Strategy',
    modules: [
      { title: 'Capital Deployment & Cash Flow Engineering', lessons: 6 },
      { title: 'The 90-Day Blueprint: From Borrower to Lender', lessons: 7 },
    ],
    downloads: [
      '90-Day GWOP Blueprint workbook',
      'Capital deployment tracker',
      'Execution metrics sheet',
    ],
    /* Memo §8 — which Blueprint section this level completes. Verbatim from
       his headings; changing them breaks the link between what the page
       promises and what the workbook delivers. */
    blueprintSection: 'MY 90-DAY EXECUTION PLAN' },
] as const

/* ── Derived totals ───────────────────────────────────────────────────────
   ⚠ COMPUTED, NEVER TYPED. The capstone bar prints "8 modules · 47 lessons ·
   12 downloads" and all three are summed from the data above. Typing them
   invites the arithmetic to drift the first time a module moves, and a wrong
   total on a page that also says "non-refundable" is a refund argument we
   would lose. */
export const lessonsIn = (l: PathwayLevel) =>
  l.modules.reduce((sum, m) => sum + m.lessons, 0)

export const TOTAL_MODULES = PATHWAY.reduce((s, l) => s + l.modules.length, 0)
export const TOTAL_LESSONS = PATHWAY.reduce((s, l) => s + lessonsIn(l), 0)
export const TOTAL_DOWNLOADS = PATHWAY.reduce((s, l) => s + l.downloads.length, 0)

/* Memo §8: the Blueprint is built progressively, not handed over at the end.
   The bar sits under the four levels because it is what they add up to — not
   a fifth product. */
export const CAPSTONE = {
  eyebrow: 'The capstone · built across all four levels',
  title: 'The Completed GWOP Blueprint',
} as const

/* Section heading and lede for the pathway block, from the same mockup.
   Previously hardcoded inside /830 as "Four levels, in order." with "Each one
   has a clear purpose and a clear outcome." Sourced here because the copy is
   rendered on more than one surface and drifted once already. */
export const PATHWAY_HEADING = 'Four levels. One Blueprint.'
export const PATHWAY_LEDE =
  "The order isn't arbitrary — each level has to hold before the next one works."