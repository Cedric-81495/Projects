import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PATHWAY } from '@/content/pathway'
import { byLevel, moduleStatus, moduleMinutes, assetsForLevel, assetHref } from '@/content/modules'
import { createServerSupabase } from '@/lib/supabase/server'
import { LEVELS, canAccessLevel, type AccessState } from '@/lib/access/policy'
import { loadAccessState } from '@/lib/access/load'

/* Dynamic, not static: the page now differs by who is asking. Prerendering it
   would serve one visitor's access state to everyone. */
export const dynamic = 'force-dynamic'

export default async function LevelPage(
  { params }: { params: Promise<{ level: string }> },
) {
  const { level } = await params
  const meta = PATHWAY.find(l => l.slug === level)
  if (!meta) notFound()

  const mods = byLevel(level)

  /* ⚠ ONLY ASSETS WITH A KEY. `key` is undefined until the file is actually
     uploaded (content/modules.ts, build order item 3). Rendering a link for an
     unuploaded asset gives a student a 404 from /api/v1/asset, which reads as
     broken rather than as "not ready yet". Filter, do not render-and-hope. */
  const docs = assetsForLevel(level).filter(a => a.key)

  /* ACCESS.
     Until now this page rendered the module list for anyone signed in, so every
     level opened regardless of enrolment and the lock states in the nav and on
     the dashboard were decoration. No paid material leaked — lesson media is
     served through an RLS-bound query that returns nothing without entitlement —
     but a student could reach a level they had not bought and see a list that
     then did nothing, which reads as broken rather than locked.

     canAccessLevel, never `level <= enrolledLevel` inline. Same rule, one
     place. */
  const supabase = await createServerSupabase()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id ?? ''
  /* Both: max for the "you have reached" copy, the array for the gate. See
     0014_per_level_access.sql. */
  const [{ data: enrolled }, { data: levels }] = await Promise.all([
    supabase.rpc('max_enrolled_level', { uid: userId }),
    supabase.rpc('enrolled_levels', { uid: userId }),
  ])

  const levelNumber = LEVELS.find(l => l.slug === level)?.level ?? 99
  /* ⚠ THE ROLE IS FETCHED, NOT ASSUMED — corrected 2026-09-21. This built
     `role: 'student'` by hand, so a staff reviewer was shown the locked state
     on a level the RLS policy would have served them. One loader now answers
     for the nav, the dashboard and this page. See lib/access/load.ts. */
  const state = await loadAccessState(supabase)
  const access: AccessState = state ?? {
    userId,
    role: 'student',
    enrolledLevel: typeof enrolled === 'number' ? enrolled : 0,
    enrolledLevels: Array.isArray(levels) ? (levels as number[]) : [],
  }
  const unlocked = canAccessLevel(access, levelNumber)

  return (
    <>
      <section>
        <div className="wrap">
          <p className="crumb"><Link href="/app">Student area</Link> › {meta.label}</p>

          <div className="head">
            {/* ⚠ `role` BECAME `title` 2026-09-08 with the stage removal —
                "Level 1 · Personal Credit". This is the student area, so it
                must match what the marketing pathway cards say. */}
            <p className="tag">{meta.label} · {meta.title}</p>
            <h2 className="h2">{meta.goal}</h2>
            <p className="lede">{meta.detail}</p>
          </div>

          {!unlocked && (
            /* Wording matches the dashboard card exactly. Not a new pricing
               claim — the free-vs-paid rule is still the brand direction's to make, and this
               says only what is already said elsewhere. */
            <div className="polocked" role="status">
              <p className="polocked-h">This level is not unlocked yet</p>
              <p className="polocked-p">
                Unlocks with {meta.label} enrollment. The outline below shows
                what it covers.
              </p>
              <Link className="btn btn-e" href="/membership">See membership options</Link>
            </div>
          )}

          <div className="mods">
            {mods.map(m => {
              const status = moduleStatus(m)
              const mins = moduleMinutes(m)
              return (
                <Link
                  className="mod"
                  href={`/app/${level}/${m.slug}`}
                  key={m.slug}
                  data-locked={status !== 'ready'}
                >
                  <span className="mn">{String(m.order).padStart(2, '0')}</span>
                  <span>
                    <h3>{m.title}</h3>
                    {/* Internal production status ("In production", "Missing
                        assets") stays on /admin. A student sees what the module
                        contains and whether it is open — nothing about our
                        pipeline.

                        ⚠ THE RUNTIME IS ONLY SHOWN WHEN IT IS KNOWN. It used to
                        read "{m.minutes} min" from a number the scaffold
                        invented; the master doc has no runtimes and nothing is
                        filmed. A lesson count is true today, and the runtime
                        appears beside it the moment moduleMinutes() can add one
                        up from real files. */}
                    <span className="meta">
                      {m.lessons.length} lesson{m.lessons.length === 1 ? '' : 's'}
                      {mins !== null && <> · {mins} min</>}
                    </span>
                  </span>
                  <span className="go">{status === 'ready' ? 'Open ›' : 'Soon'}</span>
                </Link>
              )
            })}
          </div>

          {/* ═══ COURSE DOCUMENTS ═══════════════════════════════════════════
              The PDFs this level ships with. assetsForLevel() is the single
              source of which files belong where — three of the twelve ship in
              two levels each, so this list is NOT derivable from the filename
              prefix. GWOP-L1-Master-The-Money.pdf appears on Level 2 as well,
              and a student there sees `title`, never the filename.

              ⚠ RENDERED ONLY WHEN THE LEVEL IS UNLOCKED. /api/v1/asset would
              refuse a non-entitled request anyway — this is the affordance,
              not the guarantee — but listing a locked level's documents would
              put twelve dead links in front of someone who cannot open one.

              ⚠ NEVER PRINT `pages`. The master doc is explicit: Level 1 is the
              heaviest and the cheapest, Level 4 the lightest and the most
              expensive. True, and it reads badly in a list.

              ⚠ PLAIN <a>, NOT next/link. A free asset resolves to a public
              /notes/ path and a paid one to /api/v1/asset, which answers with a
              307 to a signed URL. Next's client router would try to treat both
              as in-app navigations. target/rel keep the portal tab alive
              behind the PDF viewer. */}
          {unlocked && docs.length > 0 && (
            <div className="docs-wrap">
              <h3 className="docs-h">Course documents</h3>
              <div className="mods">
                {docs.map(a => (
                  <a
                    className="mod"
                    href={assetHref(a.key!)}
                    key={a.file}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="mn">PDF</span>
                    <span>
                      <h3>{a.title}</h3>
                      <span className="meta">
                        {a.free ? 'Free · yours to keep' : 'Included with this level'}
                      </span>
                    </span>
                    <span className="go">Open ›</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
