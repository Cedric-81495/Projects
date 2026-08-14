/* ═══════════════════════════════════════════════════════════════════════════
   MODULES  —  OWNER: MAUI + SHEENA  ·  from Surpaul's source material
   ⚠️ PLACEHOLDER DATA. Structure is final; titles are not.
   Tracker: "Organize modules by GWOP level" (Maui, Aug 23, support Jhon)
   Module standard: Visual Build Package p.3
   ═══════════════════════════════════════════════════════════════════════════ */
export type ModuleStatus = 'ready' | 'pending' | 'missing'

/* ── ASSET SLOTS ───────────────────────────────────────────────────────────
   Maui's tracker task is "upload modules, organize by level" — but until now
   there was nowhere to put a file. These four fields are that place.

   Each is a URL. Two forms work:
     · `/notes/L1-01-credit-foundations-note.pdf`  → served from public/
     · `https://drive.google.com/...`              → Drive link, nothing to deploy

   Naming follows the file spec: L{level}-{order}-{slug}-{kind}.{ext}

   ⚠️ ACCESS: anything under public/ is downloadable by anyone with the URL.
   That is fine for `free: true` modules. Paid modules must use a Drive link
   with restricted sharing, or wait for the real upload platform after Aug 30.
   ────────────────────────────────────────────────────────────────────────── */
export type Module = {
  slug: string
  level: 'freshman' | 'sophomore' | 'junior' | 'senior'
  order: number
  title: string
  minutes: number
  status: ModuleStatus
  free?: boolean
  /** Student-ready course note PDF — Visual Build Package p.2 standard */
  note?: string
  /** Printable workbook / worksheet pages, if separate from the note */
  workbook?: string
  /** Lesson video */
  video?: string
  /** Card thumbnail */
  thumb?: string
}

/** Which assets a module is still missing. Drives /admin so Maui can see gaps. */
export const missingAssets = (m: Module) =>
  (['note', 'video', 'thumb'] as const).filter(k => !m[k])

export const MODULES: Module[] = [
  /* First real student material received — Shin/Maui, Aug 14. Course Note 01,
     8 pages, built to the p.2 standard (cover, brief, teach, worked example,
     framework worksheet, apply, act). Still owed for this module: video + thumb. */
  { slug: 'credit-foundations',   level: 'freshman',  order: 1, title: 'Credit Foundations',        minutes: 14, status: 'ready',   free: true,
    note: '/notes/L1-01-credit-foundations-note.pdf' },
  { slug: 'reading-your-report',  level: 'freshman',  order: 2, title: 'Reading Your Report',       minutes: 18, status: 'ready' },
  { slug: 'cash-flow-basics',     level: 'freshman',  order: 3, title: 'Cash Flow Basics',          minutes: 16, status: 'pending' },
  { slug: 'banking-and-debt',     level: 'freshman',  order: 4, title: 'Banking &amp; Debt',            minutes: 21, status: 'missing' },

  { slug: 'business-setup',       level: 'sophomore', order: 1, title: 'Business Setup',            minutes: 22, status: 'ready' },
  { slug: 'records-that-hold-up', level: 'sophomore', order: 2, title: 'Records That Hold Up',      minutes: 19, status: 'pending' },
  { slug: 'funding-readiness',    level: 'sophomore', order: 3, title: 'Funding Readiness',         minutes: 24, status: 'missing' },

  { slug: 'revenue-systems',      level: 'junior',    order: 1, title: 'Revenue Systems',           minutes: 20, status: 'pending' },
  { slug: 'accessing-capital',    level: 'junior',    order: 2, title: 'Accessing Capital',         minutes: 26, status: 'missing' },
  { slug: 'protection',           level: 'junior',    order: 3, title: 'Protection',                minutes: 17, status: 'missing' },

  { slug: 'assets-and-investing', level: 'senior',    order: 1, title: 'Assets &amp; Investing',        minutes: 23, status: 'missing' },
  { slug: 'estate-and-legacy',    level: 'senior',    order: 2, title: 'Estate &amp; Legacy',           minutes: 25, status: 'missing' },
]

export const byLevel = (level: string) =>
  MODULES.filter(m => m.level === level).sort((a, b) => a.order - b.order)

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  ready:   'Ready',
  pending: 'In production',
  missing: 'Missing assets',
}
