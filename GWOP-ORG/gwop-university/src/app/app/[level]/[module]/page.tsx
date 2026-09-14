import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PATHWAY } from '@/content/pathway'
import { MODULES, byLevel, assetHref, moduleStatus, moduleMinutes } from '@/content/modules'
import { LessonPlayer } from '@/components/portal/LessonPlayer'

export function generateStaticParams() {
  return MODULES.map(m => ({ level: m.level, module: m.slug }))
}

/* Module view. Workbook panel is Visual Build Package p.3, verbatim structure. */
export default async function ModulePage(
  { params }: { params: Promise<{ level: string; module: string }> },
) {
  const { level, module } = await params
  const meta = PATHWAY.find(l => l.slug === level)
  const mod = byLevel(level).find(m => m.slug === module)
  if (!meta || !mod) notFound()

  return (
    <>
      <section>
        <div className="wrap">
          <p className="crumb">
            <Link href="/app">Student area</Link> ›{' '}
            <Link href={`/app/${level}`}>{meta.label}</Link> › {mod.title}
          </p>

          <div className="head">
            <p className="tag">{meta.label} {String(mod.order).padStart(2, '0')}</p>
            <h2 className="h2">{mod.title}</h2>
            {/* ⚠ WAS "{mod.minutes} minutes". That number was invented by the
                scaffold and printed as fact next to a no-refund policy. The
                master doc has no runtimes — item 9 is "resolve the video
                runtime problem, then film" — so the lesson count is what we
                can say truthfully, and the runtime joins it when real files
                exist. */}
            <p className="lede">
              {mod.lessons.length} lesson{mod.lessons.length === 1 ? '' : 's'}
              {moduleMinutes(mod) !== null && <> · {moduleMinutes(mod)} minutes</>}
              {' '}· {meta.detail}
            </p>
          </div>

          {/* ⚠ STATUS COMES FROM content/modules.ts, NOT FROM THE DATABASE.
              Nothing fetches /api/v1/lessons/[id]/playback yet, so `url` is
              never passed and every module renders the waiting state today.
              That is accurate — no lesson video has been filmed.

              When the player is wired up, fetch the ticket and spread it:
              <LessonPlayer {...ticket} title={mod.title} />. The props are
              deliberately the ticket's shape so that is the only edit here. */}
          <LessonPlayer status={moduleStatus(mod)} title={mod.title} />

          {/* ═══ LESSONS ═══════════════════════════════════════════════════
              The module's contents, from Shin's master doc. Rendered whether
              or not anything is filmed: a student who paid for this level is
              entitled to know what it covers, and an empty module page reads
              as a broken purchase.

              ⚠ NOT LINKS. There is no per-lesson route and no per-lesson
              video yet. A link that goes nowhere is worse than plain text —
              it invites a click and answers with a 404. Make these links when
              lessons become individually addressable, not before. */}
          <ol className="lessonlist">
            {mod.lessons.map(l => (
              <li key={l.slug} data-status={l.status}>
                <span className="ln">{l.n}</span>
                <span className="lt">{l.title}</span>
                {l.status === 'ready' && <span className="lr">Ready</span>}
              </li>
            ))}
          </ol>

          {/* ═══ WORKBOOK · package p.3 ═══ */}
          <div className="wb" style={{ marginTop: 26, maxWidth: 460 }}>
            <div className="wh">
              <p className="lv">{meta.label} {String(mod.order).padStart(2, '0')}</p>
              <h3>{mod.title}</h3>
            </div>
            <div className="wbody">
              <h4>Your Credit Snapshot</h4>
              {['Creditor / Account', 'Balance / Limit', 'Status', 'Next Action'].map(f => (
                <div className="frow" key={f}><b>{f}</b><div className="ln" /></div>
              ))}
              <div className="moves">
                <h4>My Next 3 Moves</h4>
                {[1, 2, 3].map(n => (
                  <div className="move" key={n}>
                    <span className="mvn">{n}</span><span className="ln" />
                  </div>
                ))}
              </div>
              <p className="ak">Action › Knowledge</p>
            </div>
          </div>

          {/* Course note. Renders only when Maui has attached a file — a
              download button that 404s is worse than no button. */}
          {mod.note && (
            <p style={{ marginTop: 22 }}>
              {/* assetHref, never mod.note directly. A public path passes
                  through; a bucket key becomes the entitlement-checked route
                  that hands back an expiring link. */}
              <a className="btn btn-o btn-sm" href={assetHref(mod.note)} target="_blank" rel="noopener">
                Download course note (PDF)
              </a>
            </p>
          )}
        </div>
      </section>
    </>
  )
}
