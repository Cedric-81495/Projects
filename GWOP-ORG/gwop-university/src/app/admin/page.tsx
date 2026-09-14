import type { Metadata } from 'next'
import Link from 'next/link'
import { PATHWAY } from '@/content/pathway'
import { MODULES, byLevel, STATUS_LABEL, missingAssets, moduleStatus, moduleMinutes, TOTAL_LESSONS } from '@/content/modules'
import { Crest } from '@/components/Chrome'

export const metadata: Metadata = {
  title: 'Module Admin — GWOP University',
  robots: { index: false, follow: false },
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE ADMIN  —  built for MAUI's tracker tasks:
     "Organize modules by GWOP level"  (Aug 23, support: Jhon)
     "Report missing items" / "identify missing assets"
   Read-only status view. No auth yet — Phase 2. Do not expose publicly.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Admin() {
  /* Derived, never stored — see moduleStatus(). A module is only as ready as
     its weakest lesson, so these counts cannot flatter the pipeline. */
  const total = MODULES.length
  const ready = MODULES.filter(m => moduleStatus(m) === 'ready').length
  const missing = MODULES.filter(m => moduleStatus(m) === 'missing').length
  const lessonsReady = MODULES.reduce(
    (s, m) => s + m.lessons.filter(l => l.status === 'ready').length, 0,
  )

  return (
    <>
      <div className="abar">
        <Crest size={30} />
        <b>Module Admin</b>
        <span className="who">Maui &amp; Sheena</span>
      </div>

      <section>
        <div className="wrap">
          <div className="head">
            <p className="tag">Content status</p>
            <h2 className="h2">Level 1\u2013Level 4 Map</h2>
            <p className="lede">
              {/* Aug 22 deadline removed 2026-09-03 — it has passed and the
                  content is still outstanding. */}
              Every module the app expects, by level, from the Pricing, Payment
              &amp; Package Master. Anything not marked ready is still to be
              filmed or written.
            </p>
          </div>

          <div className="stats">
            <div className="stat"><b>{ready}/{total}</b><span>Ready to publish</span></div>
            <div className="stat"><b>{total - ready - missing}</b><span>In production</span></div>
            <div className="stat"><b>{missing}</b><span>Missing assets</span></div>
            {/* The module counts round off how much is left; the lesson count is
                the actual production backlog. 8 modules reads as nearly done;
                47 lessons does not. */}
            <div className="stat"><b>{lessonsReady}/{TOTAL_LESSONS}</b><span>Lessons filmed</span></div>
          </div>

          {PATHWAY.map(l => {
            const mods = byLevel(l.slug)
            const done = mods.filter(m => moduleStatus(m) === 'ready').length
            return (
              <div className="lvlblock" key={l.slug}>
                <div className="lvlhead">
                  <h3>{l.label}</h3>
                  <span className="chip ok">{l.title}</span>
                  <span className="cnt">{done}/{mods.length} ready</span>
                </div>

                <div className="mods">
                  {mods.map(m => (
                    <div className="mod" key={m.slug}>
                      <span className="mn">{String(m.order).padStart(2, '0')}</span>
                      <span>
                        <h3>{m.title}</h3>
                        <span className="meta">
                          {m.lessons.length} lessons
                          {moduleMinutes(m) !== null && <> · {moduleMinutes(m)} min</>}
                          {' '}· {m.slug}
                          {/* Maui's tracker task is "report missing items" —
                              this names them instead of leaving her to guess. */}
                          {missingAssets(m).length > 0 && (
                            <> · needs {missingAssets(m).join(', ')}</>
                          )}
                          {m.note && <> · note ✓</>}
                        </span>
                      </span>
                      <span className={`chip ${
                        moduleStatus(m) === 'ready' ? 'ok'
                          : moduleStatus(m) === 'pending' ? 'wait' : 'miss'
                      }`}>{STATUS_LABEL[moduleStatus(m)]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <p className="lede" style={{ marginTop: 8 }}>
            Status comes from <code>src/content/modules.ts</code>. Upload and reordering land
            in Phase 2 — until then Maui edits that file, or sends the list to Jhon.{' '}
            <Link href="/app">View the student side ›</Link>
          </p>
        </div>
      </section>
    </>
  )
}
