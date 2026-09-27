import Link from 'next/link'
import { PATHWAY } from '@/content/pathway'
import {
  byLevel, STATUS_LABEL, missingAssets, moduleStatus, moduleMinutes,
  MODULES, TOTAL_LESSONS,
} from '@/content/modules'

/* ═══ CURRICULUM — every module the app expects, by level ═══════════════
   Built for Maui's "Organize modules by GWOP level" and "Report missing items".

   ⚠ STATUS IS DERIVED, NEVER STORED. moduleStatus() takes the worst of a
   module's lessons. A module cannot claim 'ready' while a lesson inside it has
   no file — which is precisely how a student reaches a player that never loads.

   ⚠ THE SOURCE IS content/modules.ts, NOT THE DATABASE. That file is what the
   portal renders, so this page cannot disagree with what a student sees. The
   lessons TABLE now holds the same 47 rows (migration 0028) but carries the
   production truth — video_id, published — rather than the plan. */
export default function AdminCurriculum() {
  const ready = MODULES.filter(m => moduleStatus(m) === 'ready').length
  const missing = MODULES.filter(m => moduleStatus(m) === 'missing').length
  const total = MODULES.length
  const lessonsReady = MODULES.reduce(
    (s, m) => s + m.lessons.filter(l => l.status === 'ready').length, 0,
  )

  return (
    <div className="wrap">
      <div className="head">
        <p className="tag">Content status</p>
        <h2 className="h2">Level 1–Level 4 Map</h2>
        <p className="lede">
          Every module the app expects, by level, from the Pricing, Payment
          &amp; Package Master. Anything not marked ready is still to be
          filmed or written.
        </p>
      </div>

      <div className="stats">
        <div className="stat"><b>{ready}/{total}</b><span>Ready to publish</span></div>
        <div className="stat"><b>{total - ready - missing}</b><span>In production</span></div>
        <div className="stat"><b>{missing}</b><span>Missing assets</span></div>
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
  )
}
