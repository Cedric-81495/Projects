import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { loadAccessState } from '@/lib/access/load'
import { isStaff } from '@/lib/access/policy'
import { PATHWAY } from '@/content/pathway'
import {
  MODULES, moduleStatus, TOTAL_LESSONS, TOTAL_MODULES,
  COURSE_ASSETS, DOWNLOAD_STATUS,
} from '@/content/modules'

export const dynamic = 'force-dynamic'

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD — "how are we doing", on one screen.

   ⚠ COUNTS ONLY. NO NAMES, NO EMAILS, NO INDIVIDUAL PAYMENTS. Staff can read
   every profile, enrollment and payment row under RLS, so a student list here
   would work. It is left out on purpose — see the note in layout.tsx. The
   queries below use head:true wherever possible, so rows never leave Postgres;
   only the count does.

   ⚠ REVENUE IS THE ONE EXCEPTION AND IT IS DELIBERATE. PostgREST cannot sum
   server-side without an RPC, so amount_cents is selected and summed here.
   That column is an integer and carries no identity — no user_id, no email,
   no Stripe reference. If this ever needs more than the amount, write an RPC
   rather than widening the select.

   ⚠ THE GATE IS REPEATED FROM layout.tsx ON PURPOSE. A layout and its page
   render in parallel; this page queries the database, so it checks for itself
   rather than trusting the ordering. The three content pages do not, because
   they read a TypeScript file and reach nothing.
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function AdminDashboard() {
  const supabase = await createServerSupabase()
  const access = await loadAccessState(supabase)
  if (!access || !isStaff(access)) notFound()

  const [enrollments, paid, founding, students, cutoff] = await Promise.all([
    supabase.from('enrollments').select('level').eq('status', 'active'),
    supabase.from('payment_references').select('amount_cents').eq('status', 'paid'),
    supabase.from('founding_members').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    /* ⚠ THE CUTOFF IS READ, NEVER RESTATED. founding_member_cutoff() carries
       its own instruction: "Server-side source of truth — UI copy must read
       from this, never restate it." Hardcoding '30 Sep' here would be a second
       copy of the deadline that drifts the moment the first one moves, and the
       date is not a fixed offset anyway — 11:59pm America/New_York is 03:59 UTC
       while daylight time is in effect and 04:59 after it ends. */
    supabase.rpc('founding_member_cutoff'),
  ])

  const perLevel = (n: number) => (enrollments.data ?? []).filter(e => e.level === n).length

  /* Null when the RPC is unavailable — an older database, or the function
     renamed. The tile degrades to the bare count rather than printing a
     confident wrong date. */
  const cutoffAt = typeof cutoff.data === 'string' ? new Date(cutoff.data) : null
  const msLeft = cutoffAt ? cutoffAt.getTime() - Date.now() : null
  const daysLeft = msLeft === null ? null : Math.ceil(msLeft / 86_400_000)
  const cutoffNote =
    cutoffAt === null ? 'Founding members'
    : daysLeft !== null && daysLeft > 1 ? `Founding members · ${daysLeft} days left`
    : daysLeft === 1 ? 'Founding members · closes tomorrow'
    : daysLeft === 0 ? 'Founding members · closes today'
    : 'Founding members · register closed'
  const revenue = (paid.data ?? []).reduce((s, p) => s + (p.amount_cents ?? 0), 0)

  const modsReady = MODULES.filter(m => moduleStatus(m) === 'ready').length
  const lessonsReady = MODULES.reduce(
    (s, m) => s + m.lessons.filter(l => l.status === 'ready').length, 0,
  )
  const assetsUploaded = COURSE_ASSETS.filter(a => a.key).length
  const dl = Object.values(DOWNLOAD_STATUS)
  const dlShips = dl.filter(d => d.status === 'ships').length

  /* ⚠ THE FOUR GATES ARE SHIN'S, VERBATIM FROM THE MASTER BUILD & LAUNCH
     REQUIREMENTS. Recorded here rather than in a document because a document
     goes stale on the shelf and this does not.

     ⚠ `done` IS HARDCODED, NOT DERIVED, AND THAT IS HONEST. "Attorney review
     complete" is not a state any table holds. Flipping one of these is a
     deliberate edit by somebody who knows it is true. Do not wire it to a
     proxy — a green tick nobody earned is worse than no tick. */
  const gates: { n: number; label: string; done: boolean; note?: string }[] = [
    { n: 1, label: 'Upload the twelve reissued PDFs', done: true,
      note: 'all twelve serving, access tested both directions' },
    { n: 2, label: 'Fix the Level 4 access defect', done: true,
      note: 'per-level entitlement, verified against the RLS policy' },
    { n: 3, label: 'Attorney review — refund line, Founding Member terms, Lesson 8.7',
      done: false, note: 'the only one left, and the one we do not control the speed of' },
    { n: 4, label: 'One-time checkout only — no instalments, no BNPL', done: true },
  ]
  const gatesDone = gates.filter(g => g.done).length

  return (
    <div className="wrap">
      <div className="head">
        <p className="tag">Overview</p>
        <h2 className="h2">Where we are</h2>
        <p className="lede">
          Content status is read from the codebase; counts are read from the
          database. Nothing here is typed in by hand except the launch gates.
        </p>
      </div>

      <div className="lvlblock">
        <div className="lvlhead">
          <h3>Launch gate</h3>
          <span className={`chip ${gatesDone === gates.length ? 'ok' : 'wait'}`}>
            {gatesDone} of {gates.length} closed
          </span>
          <span className="cnt">Master Build &amp; Launch Requirements</span>
        </div>
        <div className="mods">
          {gates.map(g => (
            <div className="mod" key={g.n}>
              <span className="mn">{g.done ? '\u2713' : g.n}</span>
              <span>
                <h3>{g.label}</h3>
                {g.note && <span className="meta">{g.note}</span>}
              </span>
              <span className={`chip ${g.done ? 'ok' : 'miss'}`}>
                {g.done ? 'Closed' : 'Open'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="lvlblock">
        <div className="lvlhead">
          <h3>Content</h3>
          <span className="cnt">from src/content/modules.ts</span>
        </div>
        <div className="stats">
          <div className="stat"><b>{modsReady}/{TOTAL_MODULES}</b><span>Modules ready</span></div>
          {/* 8 modules reads as nearly done; 47 lessons does not. The lesson
              count is the real backlog, so it sits beside the module one. */}
          <div className="stat"><b>{lessonsReady}/{TOTAL_LESSONS}</b><span>Lessons filmed</span></div>
          <div className="stat"><b>{assetsUploaded}/{COURSE_ASSETS.length}</b><span>PDFs uploaded</span></div>
          <div className="stat"><b>{dlShips}/{dl.length}</b><span>Downloads finished</span></div>
        </div>
      </div>

      <div className="lvlblock">
        <div className="lvlhead">
          <h3>Enrollment</h3>
          <span className="cnt">active enrollments, by level</span>
        </div>
        <div className="stats">
          {PATHWAY.map(l => (
            <div className="stat" key={l.slug}>
              <b>{perLevel(l.n)}</b><span>{l.label}</span>
            </div>
          ))}
          <div className="stat"><b>{students.count ?? 0}</b><span>Registered accounts</span></div>
        </div>
      </div>

      <div className="lvlblock">
        <div className="lvlhead">
          <h3>Commerce</h3>
          <span className="cnt">paid only — pending and failed excluded</span>
          {cutoffAt && (
            <span className={`chip ${daysLeft !== null && daysLeft < 0 ? 'miss' : daysLeft !== null && daysLeft <= 3 ? 'wait' : 'ok'}`}>
              Founding cutoff {cutoffAt.toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
                timeZone: 'America/New_York',
              })}
            </span>
          )}
        </div>
        <div className="stats">
          <div className="stat">
            <b>${(revenue / 100).toLocaleString('en-US')}</b><span>Collected</span>
          </div>
          <div className="stat"><b>{(paid.data ?? []).length}</b><span>Paid orders</span></div>
          {/* ⚠ The register is populated and the cutoff enforces itself in
              Postgres (0026). What the status is WORTH is still undecided —
              that is Surpaul's call, and this number is the reason to make it. */}
          <div className="stat"><b>{founding.count ?? 0}</b><span>{cutoffNote}</span></div>
        </div>
      </div>

      <p className="lede" style={{ marginTop: 8 }}>
        No customer names, emails or individual payments appear anywhere in this
        console — see the note at the top of <code>src/app/admin/layout.tsx</code>.{' '}
        <Link href="/app">View the student side ›</Link>
      </p>
    </div>
  )
}
