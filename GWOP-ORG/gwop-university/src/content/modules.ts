/* ═══════════════════════════════════════════════════════════════════════════
   CURRICULUM  —  OWNER: SHIN (source material) · MAUI + SHEENA (production)
   Source: GWOP INTERNAL — Pricing, Payment & Package Master, 2026-09-14.
   That document supersedes all earlier packaging guidance and is the thing to
   build from. Everything below is transcribed from it, not paraphrased.

   ⚠ REPLACED THE PLACEHOLDER CURRICULUM, 2026-09-14.

   What was here until now: twelve modules named Credit Foundations, Reading
   Your Report, Cash Flow Basics, Banking & Debt, Business Setup, Records That
   Hold Up, Funding Readiness, Revenue Systems, Accessing Capital, Protection,
   Assets & Investing, Estate & Legacy. Scaffold data from the original build.
   Not one of those titles appears in Shin's document.

   That mattered because the portal renders THIS file while the sales pages
   render content/pathway.ts. A buyer read "The Credit Game: What They Never
   Taught Us" on the funnel, paid, signed in, and found "Credit Foundations".

   ── THE SHAPE CHANGED TOO, AND THIS IS THE IMPORTANT PART ─────────────────
   The old file was flat: twelve items, each one a route at
   /app/[level]/[module]. The real curriculum is two levels deep — 8 modules
   containing 47 lessons — which is what the database already models
   (courses -> modules -> lessons) and what pathway.ts already advertises.

   So a Module now carries its lessons. The route granularity is unchanged:
   /app/[level]/[module] is still a module, there are now 8 of them instead of
   12, and the lesson list renders inside.

   ── ⚠ DURATIONS ARE GONE. THIS IS DELIBERATE. ────────────────────────────
   The old file carried `minutes: 14`, `minutes: 18` and so on, and the portal
   printed them as fact. They were invented by the scaffold. Shin's document
   contains no runtimes anywhere, and build order item 9 is "resolve the video
   runtime problem, then film" — so nobody knows them, because the lessons do
   not exist yet.

   A runtime is a specific claim about a product, displayed next to a
   no-refund policy. `minutes` is now optional and unset. The level page shows
   a lesson count instead, which is true. Fill these in from the actual files
   when they are cut — never from an estimate.

   ── STATUS IS DERIVED, NOT TYPED ─────────────────────────────────────────
   A module's status is the worst of its lessons' statuses. Typing it
   separately lets a module claim 'ready' while a lesson inside it is missing,
   which is how a student reaches a dead player.
   ═══════════════════════════════════════════════════════════════════════════ */
export type ModuleStatus = 'ready' | 'pending' | 'missing'

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  ready:   'Ready',
  pending: 'In production',
  missing: 'Missing assets',
}

export type LevelSlug = 'freshman' | 'sophomore' | 'junior' | 'senior'

export type Lesson = {
  /** The master doc's numbering, e.g. '1.1'. Displayed, and stable. */
  n: string
  slug: string
  /** Verbatim from the master doc. Do not reword — these are Shin's. */
  title: string
  status: ModuleStatus
  /** Bunny Stream GUID. Absent until filmed and uploaded. */
  video?: string
  /** Runtime in minutes. Absent until the file exists. Never estimate. */
  minutes?: number
}

export type Module = {
  slug: string
  level: LevelSlug
  /** 1-8 across the whole curriculum, matching the master doc's numbering. */
  n: number
  /** 1 or 2 — position within its level. Drives the NN badge on cards. */
  order: number
  title: string
  lessons: Lesson[]
  /** Student-ready course note PDF, if one is attached to the module itself. */
  note?: string
  /** Printable workbook pages, if separate from the note. */
  workbook?: string
  /** Card thumbnail. */
  thumb?: string
}

/* ── ASSET SLOTS ───────────────────────────────────────────────────────────
   ⚠️ TWO KINDS OF PATH, AND THE DIFFERENCE IS ACCESS CONTROL

   1. A LEADING SLASH means public/. Served straight from the CDN to anyone
      holding the URL, signed in or not. Correct for free material and nothing
      else.
        '/notes/GWOP-FREE-From-Handcuffs-To-Credit-Limits.pdf'

   2. NO LEADING SLASH means a key in the private Supabase bucket. Reached only
      through /api/v1/asset, which checks enrolment and then hands back a link
      that expires in minutes. Use this for anything paid.
        'notes/GWOP-L1-Master-The-Money.pdf'

   The distinction is deliberate and mechanical: a paid asset cannot be made
   public by accident, because a public path has to be typed with a slash. The
   route refuses to serve anything that starts with one.

   What it does NOT prevent is someone downloading the file and emailing it on.
   Nothing short of DRM does, and that is not worth it here — the realistic
   risk is a link leaking, and expiry closes that completely.
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Turn an asset path into something a browser can follow.
 *
 *   '/notes/x.pdf'  -> returned as-is; public/, free, CDN-served
 *   'notes/x.pdf'   -> /api/v1/asset?key=..., entitlement-checked, expiring
 *   'https://...'   -> returned as-is; an external link
 */
export function assetHref(path: string): string {
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `/api/v1/asset?key=${encodeURIComponent(path)}`
}

/* ═══ THE PDF LIBRARY ═══════════════════════════════════════════════════════
   Part One of the master doc, "Files to upload", consolidated.

   ⚠ TWELVE FILES, NOT FOURTEEN. Three paid assets ship in more than one level
   and the free Blueprint story ships in all four. The doc is explicit that
   this overlap is the mechanism that makes each level stand on its own: "it
   costs nothing to duplicate a file, and it removes every 'I need the next
   level to understand this' moment."

   ⚠ ONE OBJECT, MANY REFERENCES. `levels` is why this is a separate list
   rather than a field on Module. Uploading Master the Money twice would give
   you two keys to keep in sync, and the second one drifts the first time
   somebody reissues a page.

   ⚠ THE `L1-` PREFIX ON A SHARED FILE IS NOT A MISTAKE. Master the Money is
   named for the level it originates in and also appears in Level 2. A student
   in Level 2 downloading 'GWOP-L1-Master-The-Money.pdf' reads that as an
   error, so `title` is what the interface shows and the filename stays put.

   `pages` is recorded because the doc records it. ⚠ NEVER PUBLISH PAGE
   COUNTS — the doc says so directly: Level 1 is the heaviest and the cheapest,
   Level 4 the lightest and most expensive, which is correct but reads badly in
   a table. This field is for production tracking only.

   `key` is undefined until the file is actually uploaded. Build order item 3.
   ═══════════════════════════════════════════════════════════════════════════ */
export type CourseAsset = {
  file: string
  title: string
  pages: number
  levels: LevelSlug[]
  /** Free assets carry a public path; paid ones a private bucket key. */
  free?: boolean
  /** Bucket key or public path. Undefined = not uploaded yet. */
  key?: string
}

export const COURSE_ASSETS: CourseAsset[] = [
  { file: 'GWOP-L1-Fundable-Profile-Starter-Kit.pdf',
    title: 'Fundable Profile Starter Kit v2', pages: 23, levels: ['freshman'] },
  { file: 'GWOP-L1-Master-The-Money.pdf',
    title: 'Master the Money', pages: 23, levels: ['freshman', 'sophomore'] },
  { file: 'GWOP-L1-Foundation-Before-Credit-Repair.pdf',
    title: 'Foundation Before Credit Repair', pages: 21, levels: ['freshman'] },
  { file: 'GWOP-L1-Understanding-Credit-Repair.pdf',
    title: 'Understanding Credit Repair', pages: 22, levels: ['freshman'] },
  { file: 'GWOP-L1-Dispute-and-Correction-Letter-Pack.pdf',
    title: 'Dispute & Correction Letter Pack', pages: 13, levels: ['freshman'] },
  { file: 'GWOP-L2-The-Fundable-LLC-Build.pdf',
    title: 'The Fundable LLC Build', pages: 25, levels: ['sophomore'] },
  { file: 'GWOP-L2-Business-Credit-Tier-Map.pdf',
    title: 'Business Credit Tier Map', pages: 7, levels: ['sophomore', 'junior'] },
  { file: 'GWOP-L3-Zero-APR-Business-Credit.pdf',
    title: '0% APR Business Credit', pages: 17, levels: ['junior'] },
  { file: 'GWOP-L3-Funding-Readiness-Document-Pack.pdf',
    title: 'Funding Readiness Document Pack', pages: 11, levels: ['junior', 'senior'] },
  { file: 'GWOP-L4-The-Funding-Assembly-Line.pdf',
    title: 'The Funding Assembly Line', pages: 24, levels: ['senior'] },
  { file: 'GWOP-L4-Good-Credit-Gave-Me-Options.pdf',
    title: 'Good Credit Gave Me Options', pages: 15, levels: ['senior'] },
  /* Ships with every level and is excluded from all page counts in the doc.
     Free, so when uploaded it takes a public path with a leading slash. */
  { file: 'GWOP-FREE-From-Handcuffs-To-Credit-Limits.pdf',
    title: 'From Handcuffs to Credit Limits', pages: 11, free: true,
    levels: ['freshman', 'sophomore', 'junior', 'senior'] },
]

/** The PDFs a given level ships with, shared ones included. */
export const assetsForLevel = (level: string) =>
  COURSE_ASSETS.filter(a => a.levels.includes(level as LevelSlug))

/* ═══ THE DOWNLOADS ═════════════════════════════════════════════════════════
   Thirteen worksheets and checklists, four in Level 1 and three in each of the
   others. Titles come from pathway.ts, which the funnel already renders — they
   are NOT duplicated here, because two lists of the same names drift.

   What lives here is the production status from the master doc, which is the
   part Maui and Sheena need and students never see:

     'ships'   — already exists as a finished PDF
     'extract' — has to be cut out of a larger document
     'build'   — does not exist in any form; usually a spreadsheet

   Eleven of the thirteen are not built. Build order item 7.
   ═══════════════════════════════════════════════════════════════════════════ */
export type DownloadStatus = 'ships' | 'extract' | 'build'

export const DOWNLOAD_STATUS: Record<string, { status: DownloadStatus; from: string }> = {
  'Credit report review checklist':         { status: 'extract', from: 'Starter Kit M4' },
  'Credit utilization worksheet':           { status: 'extract', from: 'Starter Kit M6' },
  'Personal financial inventory':           { status: 'extract', from: 'Master the Money worksheet' },
  'Dispute & correction letter pack':       { status: 'ships',   from: '13pp PDF' },
  'Business setup checklist':               { status: 'extract', from: 'LLC Build readiness gate' },
  'Fundable Profile checklist':             { status: 'extract', from: 'Funding Readiness Pack S1-5' },
  'Business funding preparation checklist': { status: 'extract', from: 'Tier Map 90-day sequence' },
  'Bank relationship tracker':              { status: 'build',   from: 'spreadsheet, Assembly Line Step 1' },
  'Funding readiness checklist':            { status: 'ships',   from: '11pp PDF' },
  'Application sequencing worksheet':       { status: 'build',   from: 'spreadsheet, Assembly Line Step 6' },
  '90-Day GWOP Blueprint workbook':         { status: 'build',   from: 'extract from Mentorship M8' },
  'Capital deployment tracker':             { status: 'build',   from: 'spreadsheet, Assembly Line Step 11' },
  'Execution metrics sheet':                { status: 'build',   from: 'spreadsheet, Mentorship M8 S5' },
}

/* ═══ THE 8 MODULES · 47 LESSONS ════════════════════════════════════════════
   Transcribed from Part One. Lesson titles are Shin's wording — do not tidy
   the punctuation, shorten them for layout, or sentence-case them.

   Every lesson is `missing`: none has been filmed. That is the honest state
   and it is what the portal should show. Move one to 'pending' when it is in
   production and 'ready' only when the video is uploaded and playable.
   ═══════════════════════════════════════════════════════════════════════════ */
export const MODULES: Module[] = [
  /* ── LEVEL 1 · LEARN THE GAME · Personal Credit ───────────────────────── */
  {
    slug: 'the-credit-game', level: 'freshman', n: 1, order: 1,
    title: 'The Credit Game: What They Never Taught Us',
    lessons: [
      { n: '1.1', slug: 'money-is-a-tool',        title: 'Money is a tool, not the trophy',              status: 'missing' },
      { n: '1.2', slug: 'the-story-banks-read',   title: 'Your credit report is the story banks read',   status: 'missing' },
      { n: '1.3', slug: 'the-five-pillars',       title: 'The five pillars lenders actually weigh',      status: 'missing' },
      { n: '1.4', slug: 'fundability-score',      title: 'Score your profile: the Fundability Score',    status: 'missing' },
      { n: '1.5', slug: 'statement-date-play',    title: 'The statement date play',                      status: 'missing' },
      { n: '1.6', slug: 'the-trap-list',          title: 'The trap list: 609 letters, sweeps, and CPNs', status: 'missing' },
    ],
  },
  {
    slug: 'credit-cleanup-and-control', level: 'freshman', n: 2, order: 2,
    title: 'Credit Cleanup & Control',
    lessons: [
      { n: '2.1', slug: 'stop-the-bleeding',      title: 'Stop the bleeding before you dispute',         status: 'missing' },
      { n: '2.2', slug: 'read-all-three-reports', title: 'Pull and read all three reports',              status: 'missing' },
      { n: '2.3', slug: 'what-can-be-disputed',   title: "What can be disputed — and what can't",        status: 'missing' },
      { n: '2.4', slug: 'the-cleanup-order',      title: 'The cleanup order that protects your score',   status: 'missing' },
      { n: '2.5', slug: 'disputes-that-get-read', title: 'Writing disputes that actually get read',      status: 'missing' },
      { n: '2.6', slug: 'rebuild',                title: "Rebuild: removing damage isn't enough",        status: 'missing' },
    ],
  },

  /* ── LEVEL 2 · GET IN POSITION · Business Foundation & Business Credit ── */
  {
    slug: 'the-perfect-llc', level: 'sophomore', n: 3, order: 1,
    title: 'The Perfect LLC: Identity & Structure',
    lessons: [
      { n: '3.1', slug: 'entity-state-and-name',  title: 'Decide: entity type, state, and name',                  status: 'missing' },
      { n: '3.2', slug: 'file-the-entity',        title: 'File: articles, registered agent, operating agreement', status: 'missing' },
      { n: '3.3', slug: 'ein-naics-and-boi',      title: 'Identify: EIN, NAICS, licenses, and the BOI update',    status: 'missing' },
      { n: '3.4', slug: 'look-real',              title: 'Look real: address, phone, website, digital footprint', status: 'missing' },
      { n: '3.5', slug: 'name-match-audit',       title: 'The name match audit',                                  status: 'missing' },
    ],
  },
  {
    slug: 'business-credit-infrastructure', level: 'sophomore', n: 4, order: 2,
    title: 'Business Credit & Fundability Infrastructure',
    lessons: [
      { n: '4.1', slug: 'the-separation-rule',    title: 'Business banking and the separation rule',        status: 'missing' },
      { n: '4.2', slug: 'duns-and-the-bureaus',   title: 'D-U-N-S and the three business bureaus',          status: 'missing' },
      { n: '4.3', slug: 'the-four-tiers',         title: 'The four tiers of business credit',               status: 'missing' },
      { n: '4.4', slug: 'the-vendor-sequence',    title: 'The vendor sequence: which ones actually report', status: 'missing' },
    ],
  },

  /* ── LEVEL 3 · GET FUNDED & BUILD · Funding & Banking Strategy ────────── */
  {
    slug: 'bank-relationships', level: 'junior', n: 5, order: 1,
    title: 'Bank Relationships & Underwriting Psychology',
    lessons: [
      { n: '5.1', slug: 'how-banks-decide',       title: 'How banks actually decide',          status: 'missing' },
      { n: '5.2', slug: 'relationship-banking',   title: 'Relationship banking and seasoning', status: 'missing' },
      { n: '5.3', slug: 'audit-the-bank',         title: 'Audit the bank before you apply',    status: 'missing' },
      { n: '5.4', slug: 'five-funding-pillars',   title: 'The five funding pillars',           status: 'missing' },
      { n: '5.5', slug: 'relationship-managers',  title: 'Working with relationship managers', status: 'missing' },
      { n: '5.6', slug: 'seven-gate-check',       title: 'The seven-gate readiness check',     status: 'missing' },
    ],
  },
  {
    slug: 'stacking-and-sequencing', level: 'junior', n: 6, order: 2,
    title: 'The Funding Blueprint: Stacking & Sequencing',
    lessons: [
      { n: '6.1', slug: 'zero-apr-explained',     title: '0% APR business credit: what it actually is', status: 'missing' },
      { n: '6.2', slug: 'personal-guarantee',     title: 'The personal guarantee warning',              status: 'missing' },
      { n: '6.3', slug: 'nine-approval-factors',  title: 'The nine approval factors',                   status: 'missing' },
      { n: '6.4', slug: 'right-card-for-the-job', title: 'Choosing the right card for the job',         status: 'missing' },
      { n: '6.5', slug: 'the-funding-map',        title: 'Building the funding map',                    status: 'missing' },
      { n: '6.6', slug: 'inquiry-discipline',     title: 'Sequencing, rounds, and inquiry discipline',  status: 'missing' },
      { n: '6.7', slug: 'when-not-to-apply',      title: 'Timing: when not to apply',                   status: 'missing' },
    ],
  },

  /* ── LEVEL 4 · GET WITH GWOP PLAN · Execution, Capital & Wealth ───────── */
  {
    slug: 'capital-deployment', level: 'senior', n: 7, order: 1,
    title: 'Capital Deployment & Cash Flow Engineering',
    lessons: [
      { n: '7.1', slug: 'approval-is-not-success', title: 'Approval is not success',                    status: 'missing' },
      { n: '7.2', slug: 'good-vs-bad-leverage',    title: 'Good leverage vs. bad leverage',             status: 'missing' },
      { n: '7.3', slug: 'use-of-funds-plan',       title: 'The use-of-funds plan',                      status: 'missing' },
      { n: '7.4', slug: 'allocation',              title: 'Allocation: giving every dollar a job',      status: 'missing' },
      { n: '7.5', slug: 'card-strategy',           title: 'Card strategy, points, and protecting cash', status: 'missing' },
      { n: '7.6', slug: 'cycling',                 title: 'Cycling: how banks reward good behaviour',   status: 'missing' },
    ],
  },
  {
    slug: 'the-90-day-blueprint', level: 'senior', n: 8, order: 2,
    title: 'The 90-Day Blueprint: From Borrower to Lender',
    lessons: [
      { n: '8.1', slug: 'phase-1-stabilise',      title: 'Phase 1 — stabilise (days 1-30)',                   status: 'missing' },
      { n: '8.2', slug: 'phase-2-position',       title: 'Phase 2 — position (days 31-60)',                   status: 'missing' },
      { n: '8.3', slug: 'phase-3-execute',        title: 'Phase 3 — execute (days 61-90)',                    status: 'missing' },
      { n: '8.4', slug: 'tracking-and-metrics',   title: 'Tracking and metrics',                              status: 'missing' },
      { n: '8.5', slug: 'systems-and-delegation', title: 'Systems and delegation: buying back time',          status: 'missing' },
      { n: '8.6', slug: 'borrower-to-lender',     title: 'From borrower to lender: how the other side works', status: 'missing' },
      { n: '8.7', slug: 'compliance-and-next',    title: 'Compliance, structure, and what comes next',        status: 'missing' },
    ],
  },
]

/* ── DERIVED ───────────────────────────────────────────────────────────────
   Computed, never typed. The funnel prints "8 modules · 47 lessons" from
   pathway.ts and the portal counts from here; if the two ever disagree, one of
   them has been edited without the other and the totals are how you find out.
   ────────────────────────────────────────────────────────────────────────── */
export const byLevel = (level: string) => MODULES.filter(m => m.level === level)

export const TOTAL_MODULES = MODULES.length
export const TOTAL_LESSONS = MODULES.reduce((s, m) => s + m.lessons.length, 0)

/**
 * A module is only as ready as its weakest lesson.
 *
 * Derived rather than stored so a module cannot claim 'ready' while a lesson
 * inside it has no file — which is precisely how a student reaches a player
 * that never loads.
 */
export function moduleStatus(m: Module): ModuleStatus {
  if (m.lessons.some(l => l.status === 'missing')) return 'missing'
  if (m.lessons.some(l => l.status === 'pending')) return 'pending'
  return 'ready'
}

/** Sum of known lesson runtimes, or null while any are unknown. */
export function moduleMinutes(m: Module): number | null {
  if (m.lessons.some(l => l.minutes === undefined)) return null
  return m.lessons.reduce((s, l) => s + (l.minutes ?? 0), 0)
}

/** Which assets a module is still missing. Drives /admin so Maui can see gaps. */
export const missingAssets = (m: Module) => {
  const gaps: string[] = []
  const noVideo = m.lessons.filter(l => !l.video).length
  if (noVideo > 0) gaps.push(`${noVideo} video${noVideo === 1 ? '' : 's'}`)
  if (!m.note) gaps.push('note')
  if (!m.thumb) gaps.push('thumb')
  return gaps
}

/**
 * Look up an asset by its storage key.
 *
 * ⚠ THIS IS THE AUTHORIZATION LOOKUP, NOT A CONVENIENCE. /api/v1/asset uses it
 * as the traversal guard: no arrangement of `../` matches an entry here, so
 * nothing unvalidated reaches storage. A lookup that fell back to "anything
 * under notes/" would defeat it entirely.
 *
 * ⚠ `levels` IS A LIST BECAUSE SHARED ASSETS ARE REAL. Master the Money ships
 * in Levels 1 and 2; the Funding Readiness Document Pack in 3 and 4. The
 * caller must grant access if the user can reach ANY of them, not just the
 * first — gating a shared file on its originating level would lock a Level 2
 * student out of a file Level 2 is advertised as including.
 */
export function findAssetByKey(
  key: string,
): { levels: LevelSlug[]; free: boolean } | null {
  const mod = MODULES.find(m => m.note === key || m.workbook === key)
  if (mod) return { levels: [mod.level], free: false }

  const asset = COURSE_ASSETS.find(a => a.key === key)
  if (asset) return { levels: asset.levels, free: asset.free ?? false }

  return null
}
