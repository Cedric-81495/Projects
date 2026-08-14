import type { Metadata } from 'next'
import Link from 'next/link'
import { PATHWAY } from '@/content/pathway'
import { MODULES, byLevel, STATUS_LABEL, missingAssets } from '@/content/modules'
import { Crest } from '@/components/Chrome'
import { DRAFT } from '@/config/integrations'

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
  const total = MODULES.length
  const ready = MODULES.filter(m => m.status === 'ready').length
  const missing = MODULES.filter(m => m.status === 'missing').length

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
            <h2 className="h2">Freshman–Senior Map</h2>
            <p className="lede">
              Every module the app expects, by level. Anything not marked ready needs
              chasing before the Aug 22 content deadline.
            </p>
          </div>

          <div className="stats">
            <div className="stat"><b>{ready}/{total}</b><span>Ready to publish</span></div>
            <div className="stat"><b>{total - ready - missing}</b><span>In production</span></div>
            <div className="stat"><b>{missing}</b><span>Missing assets</span></div>
          </div>

          {PATHWAY.map(l => {
            const mods = byLevel(l.slug)
            const done = mods.filter(m => m.status === 'ready').length
            return (
              <div className="lvlblock" key={l.slug}>
                <div className="lvlhead">
                  <h3>{l.label}</h3>
                  <span className="chip ok">{l.role}</span>
                  <span className="cnt">{done}/{mods.length} ready</span>
                </div>

                <div className="mods">
                  {mods.map(m => (
                    <div className="mod" key={m.slug}>
                      <span className="mn">{String(m.order).padStart(2, '0')}</span>
                      <span>
                        <h3>{m.title}</h3>
                        <span className="meta">
                          {m.minutes} min · {m.slug}
                          {/* Maui's tracker task is "report missing items" —
                              this names them instead of leaving her to guess. */}
                          {missingAssets(m).length > 0 && (
                            <> · needs {missingAssets(m).join(', ')}</>
                          )}
                          {m.note && <> · note ✓</>}
                        </span>
                      </span>
                      <span className={`chip ${
                        m.status === 'ready' ? 'ok' : m.status === 'pending' ? 'wait' : 'miss'
                      }`}>{STATUS_LABEL[m.status]}</span>
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

      {DRAFT && (
        <div className="draftbar">
          ⚠️ <b>DRAFT</b> — placeholder module data · no auth yet, do not expose publicly
        </div>
      )}
    </>
  )
}
