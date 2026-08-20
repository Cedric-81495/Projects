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

   Naming follows the file spec: L{level}-{order}-{slug}-{kind}.{ext}

   ⚠️ TWO KINDS OF PATH, AND THE DIFFERENCE IS ACCESS CONTROL

   1. A LEADING SLASH means public/. Served straight from the CDN to anyone
      holding the URL, signed in or not. Correct for `free: true` modules and
      nothing else.
        note: '/notes/L1-01-credit-foundations-note.pdf'

   2. NO LEADING SLASH means a key in the private Supabase bucket. Reached only
      through /api/v1/asset, which checks enrolment and then hands back a link
      that expires in minutes. Use this for anything paid.
        note: 'notes/L2-01-fundable-profile-note.pdf'

   The distinction is deliberate and mechanical: a paid asset cannot be made
   public by accident, because a public path has to be typed with a slash. The
   route refuses to serve anything that starts with one.

   Why expiring links rather than a proxy: a copied URL stops working within
   minutes, so it cannot be shared in a group chat or indexed by a search
   engine — while the file still streams from Supabase's CDN rather than through
   a serverless function, which matters for a 3MB PDF on venue cellular. It is
   the same mechanism playback.ts already uses for lesson video.

   What it does NOT prevent is someone downloading the file and emailing it on.
   Nothing short of DRM does, and that is not worth it here — the realistic risk
   is a link leaking, and expiry closes that completely.
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

/**
 * Turn an asset path into something a browser can follow.
 *
 * Pages should never branch on this themselves — a page that forgets is either
 * a broken link or, worse, a paid file linked directly from the bucket. One
 * function, one rule:
 *
 *   '/notes/x.pdf'  → returned as-is; public/, free, CDN-served
 *   'notes/x.pdf'   → /api/v1/asset?key=..., which checks enrolment and
 *                     redirects to a link that expires
 *   'https://...'   → returned as-is; an external Drive link
 */
export function assetHref(path: string): string {
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `/api/v1/asset?key=${encodeURIComponent(path)}`
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
  { slug: 'banking-and-debt',     level: 'freshman',  order: 4, title: 'Banking & Debt',            minutes: 21, status: 'missing' },

  { slug: 'business-setup',       level: 'sophomore', order: 1, title: 'Business Setup',            minutes: 22, status: 'ready' },
  { slug: 'records-that-hold-up', level: 'sophomore', order: 2, title: 'Records That Hold Up',      minutes: 19, status: 'pending' },
  { slug: 'funding-readiness',    level: 'sophomore', order: 3, title: 'Funding Readiness',         minutes: 24, status: 'missing' },

  { slug: 'revenue-systems',      level: 'junior',    order: 1, title: 'Revenue Systems',           minutes: 20, status: 'pending' },
  { slug: 'accessing-capital',    level: 'junior',    order: 2, title: 'Accessing Capital',         minutes: 26, status: 'missing' },
  { slug: 'protection',           level: 'junior',    order: 3, title: 'Protection',                minutes: 17, status: 'missing' },

  { slug: 'assets-and-investing', level: 'senior',    order: 1, title: 'Assets & Investing',        minutes: 23, status: 'missing' },
  { slug: 'estate-and-legacy',    level: 'senior',    order: 2, title: 'Estate & Legacy',           minutes: 25, status: 'missing' },
]

export const byLevel = (level: string) =>
  MODULES.filter(m => m.level === level).sort((a, b) => a.order - b.order)

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  ready:   'Ready',
  pending: 'In production',
  missing: 'Missing assets',
}
