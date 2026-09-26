import type { Metadata } from 'next'
import Link from 'next/link'
import { PATHWAY } from '@/content/pathway'
import { MODULES, byLevel, STATUS_LABEL, missingAssets, moduleStatus, moduleMinutes, TOTAL_LESSONS, COURSE_ASSETS, DOWNLOAD_STATUS } from '@/content/modules'
import { Crest } from '@/components/Chrome'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { loadAccessState } from '@/lib/access/load'
import { isStaff } from '@/lib/access/policy'

export const metadata: Metadata = {
  title: 'Module Admin — GWOP University',
  robots: { index: false, follow: false },
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE ADMIN  —  built for MAUI's tracker tasks:
     "Organize modules by GWOP level"  (Aug 23, support: Jhon)
     "Report missing items" / "identify missing assets"
   ⚠ STAFF ONLY — GATED 2026-09-21. This block used to read "No auth yet —
   Phase 2. Do not expose publicly." It was exposed publicly: middleware.ts
   lists /admin in PROTECTED_PREFIXES, but that only requires A SESSION, and
   signup is open to anyone. Every registered student could read the whole
   production map — which lessons are unfilmed, which assets are missing, and
   the team names in the header bar.

   No customer data was reachable here, so this was internal disclosure rather
   than a breach. It still told any curious buyer that the course they had just
   paid for was 47 lessons short.

   ⚠ notFound(), NOT A REDIRECT AND NOT A 403. Same reasoning as the asset
   route: a 403 confirms the page exists and is worth attacking. A student who
   wanders here gets the same 404 as a typo.

   ⚠ STAFF, NOT ADMIN, DESPITE THE ROUTE NAME. has_role() is a rank
   comparison, so admin and owner pass this too. Maui and Sheena — the people
   this page was built for — need reading rights, not write rights, and the
   page is read-only.
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function Admin() {
  const supabase = await createServerSupabase()
  const access = await loadAccessState(supabase)
  if (!access || !isStaff(access)) notFound()

  /* Derived, never stored — see moduleStatus(). A module is only as ready as
     its weakest lesson, so these counts cannot flatter the pipeline. */
  const total = MODULES.length
  const ready = MODULES.filter(m => moduleStatus(m) === 'ready').length
  const missing = MODULES.filter(m => moduleStatus(m) === 'missing').length
  const lessonsReady = MODULES.reduce(
    (s, m) => s + m.lessons.filter(l => l.status === 'ready').length, 0,
  )

  /* ⚠ THE TWO ASSET CLASSES THE MODULE MAP ABOVE DOES NOT COVER, ADDED
     2026-09-26. Until now this page reported modules and lessons only, so the
     twelve course PDFs and the thirteen downloads existed as status tables in
     an internal document and nowhere in the product. Anyone wanting to know
     what was outstanding had to open a PDF dated weeks earlier, which is how a
     count gets quoted wrong in a status update.

     Both read from content/modules.ts, same as everything else here. The
     numbers cannot drift from what the app ships because they ARE what the
     app ships. */
  const assetsUploaded = COURSE_ASSETS.filter(a => a.key).length
  const downloads = Object.entries(DOWNLOAD_STATUS)
  const dlShips = downloads.filter(([, d]) => d.status === 'ships').length
  const dlExtract = downloads.filter(([, d]) => d.status === 'extract').length
  const dlBuild = downloads.filter(([, d]) => d.status === 'build').length

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
            <div className="stat"><b>{assetsUploaded}/{COURSE_ASSETS.length}</b><span>PDFs uploaded</span></div>
            <div className="stat"><b>{dlShips}/{downloads.length}</b><span>Downloads finished</span></div>
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

          {/* ═══ COURSE PDFS ═════════════════════════════════════════════════
              `key` is set once a file is uploaded to the private bucket, so
              "uploaded" here is not someone ticking a box — it is whether the
              app can actually serve the file. A row without a key renders no
              link on the level page and 404s from /api/v1/asset.

              ⚠ PAGE COUNTS ARE SHOWN HERE AND NOWHERE ELSE. The master doc is
              explicit that they must never be published: Level 1 is the
              heaviest and the cheapest. This page is staff-only, and `pages`
              is exactly the production-tracking field it was recorded for. */}
          <div className="lvlblock">
            <div className="lvlhead">
              <h3>Course PDFs</h3>
              <span className="chip ok">12 files, 3 shared across levels</span>
              <span className="cnt">{assetsUploaded}/{COURSE_ASSETS.length} uploaded</span>
            </div>
            <div className="mods">
              {COURSE_ASSETS.map(a => (
                <div className="mod" key={a.file}>
                  <span className="mn">PDF</span>
                  <span>
                    <h3>{a.title}</h3>
                    <span className="meta">
                      {a.pages}pp · {a.levels.length === 4
                        ? 'all levels'
                        : a.levels.map(l => `L${['freshman','sophomore','junior','senior'].indexOf(l) + 1}`).join(' + ')}
                      {a.free && <> · free</>}
                      {' '}· {a.file}
                    </span>
                  </span>
                  <span className={`chip ${a.key ? 'ok' : 'miss'}`}>
                    {a.key ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ DOWNLOADS ════════════════════════════════════════════════════
              Thirteen worksheets and checklists. `from` is the production
              instruction, not a student-facing string — "Starter Kit M4" tells
              Maui which document to cut the extract out of.

              ⚠ TITLES ARE NOT DUPLICATED HERE. DOWNLOAD_STATUS is keyed by the
              title that content/pathway.ts already renders on the funnel, so
              the two lists cannot drift into saying different things. */}
          <div className="lvlblock">
            <div className="lvlhead">
              <h3>Downloads</h3>
              <span className="chip ok">{dlShips} finished</span>
              <span className="chip wait">{dlExtract} to extract</span>
              <span className="chip miss">{dlBuild} to build</span>
              <span className="cnt">{dlShips}/{downloads.length} done</span>
            </div>
            <div className="mods">
              {downloads.map(([title, d]) => (
                <div className="mod" key={title}>
                  <span className="mn">{d.status === 'ships' ? '\u2713' : d.status === 'extract' ? '\u2702' : '+'}</span>
                  <span>
                    <h3>{title}</h3>
                    <span className="meta">{d.from}</span>
                  </span>
                  <span className={`chip ${
                    d.status === 'ships' ? 'ok' : d.status === 'extract' ? 'wait' : 'miss'
                  }`}>
                    {d.status === 'ships' ? 'Ships' : d.status === 'extract' ? 'Extract' : 'Build'}
                  </span>
                </div>
              ))}
            </div>
          </div>

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
