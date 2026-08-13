/* ═══════════════════════════════════════════════════════════════════════════
   MODULES  —  OWNER: MAUI + SHEENA  ·  from Surpaul's source material
   ⚠️ PLACEHOLDER DATA. Structure is final; titles are not.
   Tracker: "Organize modules by GWOP level" (Maui, Aug 23, support Jhon)
   Module standard: Visual Build Package p.3
   ═══════════════════════════════════════════════════════════════════════════ */
export type ModuleStatus = 'ready' | 'pending' | 'missing'

export type Module = {
  slug: string
  level: 'freshman' | 'sophomore' | 'junior' | 'senior'
  order: number
  title: string
  minutes: number
  status: ModuleStatus
  free?: boolean
}

export const MODULES: Module[] = [
  { slug: 'credit-foundations',   level: 'freshman',  order: 1, title: 'Credit Foundations',        minutes: 14, status: 'ready',   free: true },
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
