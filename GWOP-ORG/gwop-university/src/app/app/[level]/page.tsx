import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PATHWAY } from '@/content/pathway'
import { byLevel } from '@/content/modules'
import { createServerSupabase } from '@/lib/supabase/server'
import { LEVELS, canAccessLevel, type AccessState } from '@/lib/access/policy'

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
  const { data: enrolled } = await supabase.rpc('max_enrolled_level', { uid: userId })

  const levelNumber = LEVELS.find(l => l.slug === level)?.level ?? 99
  const access: AccessState = {
    userId,
    role: 'student',
    enrolledLevel: typeof enrolled === 'number' ? enrolled : 0,
  }
  const unlocked = canAccessLevel(access, levelNumber)

  return (
    <>
      <section>
        <div className="wrap">
          <p className="crumb"><Link href="/app">Student area</Link> › {meta.label}</p>

          <div className="head">
            <p className="tag">{meta.label} · {meta.role}</p>
            <h2 className="h2">{meta.goal}</h2>
            <p className="lede">{meta.detail}</p>
          </div>

          {!unlocked && (
            /* Wording matches the dashboard card exactly. Not a new pricing
               claim — the free-vs-paid rule is still Felicia's to make, and this
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
            {mods.map(m => (
              <Link
                className="mod"
                href={`/app/${level}/${m.slug}`}
                key={m.slug}
                data-locked={m.status !== 'ready'}
              >
                <span className="mn">{String(m.order).padStart(2, '0')}</span>
                <span>
                  <h3>{m.title}</h3>
                  {/* Internal production status ("In production", "Missing
                      assets") stays on /admin. A student sees the runtime and
                      whether it is open yet — nothing about our pipeline. */}
                  <span className="meta">{m.minutes} min</span>
                </span>
                <span className="go">{m.status === 'ready' ? 'Open ›' : 'Soon'}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
