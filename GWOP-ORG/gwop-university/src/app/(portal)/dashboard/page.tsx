import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
import { LEVELS, canAccessLevel, type AccessState } from '@/lib/access/policy'

export const metadata: Metadata = {
  title: 'Dashboard · GWOP University',
  robots: { index: false, follow: false },
}

/**
 * The four-level pathway with the student's real progress.
 *
 * Every query below runs through the RLS-bound client, so a locked level
 * genuinely returns nothing rather than being filtered out in JSX. The
 * "Locked" card is rendered from the absence of data, not from a client-side
 * comparison — which means a bug in this file cannot leak content.
 */
export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user!.id

  const [{ data: enrolled }, { data: profile }] = await Promise.all([
    supabase.rpc('max_enrolled_level', { uid: userId }),
    supabase.from('profiles').select('full_name').eq('id', userId).single(),
  ])

  const enrolledLevel = typeof enrolled === 'number' ? enrolled : 0

  /* Assembled so the card gating can go through canAccessLevel rather than
     comparing numbers here. Role is 'student' because this page only ever
     decides whether to show a level card — and every query above already runs
     through the RLS-bound client, so the real gate is the database. If a staff
     override is ever wanted on this page, fetch the role rather than widening
     the comparison. */
  const access: AccessState = { userId, role: 'student', enrolledLevel }

  const progress = await Promise.all(
    LEVELS.map(async (l) => {
      const { data } = await supabase.rpc('level_progress', { p_level: l.level, uid: userId })
      return { ...l, ...(data?.[0] ?? { total: 0, completed: 0, percent: 0 }) }
    }),
  )

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <>
      <p className="tag">Your pathway</p>
      <h1 className="poh1">{firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}</h1>

      {enrolledLevel === 0 && (
        <div className="poempty">
          <h2>You&rsquo;re not enrolled yet</h2>
          <p>Freshman builds the foundation: credit, cash flow, banking and debt.</p>
          <Link className="btn btn-e" href="/membership">
            See the levels
          </Link>
        </div>
      )}

      <ol className="polevels">
        {progress.map((l) => {
          /* canAccessLevel, not `l.level <= enrolledLevel`. policy.ts is
             explicit that the moment that comparison is copied into a
             component, changing the rule means auditing the whole tree — and
             staff would have been shown locked cards despite having access. */
          const unlocked = canAccessLevel(access, l.level)
          return (
            <li key={l.slug} className={unlocked ? 'polevel' : 'polevel is-locked'}>
              <span className="pon">{l.level}</span>
              <div className="pobody">
                <h2>{l.label}</h2>
                {unlocked ? (
                  <>
                    <p className="pometa">
                      {l.completed} of {l.total} lessons complete
                    </p>
                    <div
                      className="pobar-track"
                      role="progressbar"
                      aria-valuenow={l.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${l.label} progress`}
                    >
                      <span style={{ width: `${l.percent}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="pometa">Unlocks with {l.label} enrollment</p>
                )}
              </div>
              {unlocked ? (
                /* `/app/[level]`, not `/learn/[level]`. There is no /learn route
                   — middleware.ts already records that `/learn` and `/account`
                   were listed as protected prefixes despite not existing, and
                   this link was the last place still pointing at the old path.
                   It 404'd for anyone with an unlocked level. */
                <Link className="poenter" href={`/app/${l.slug}`}>
                  {l.completed > 0 ? 'Resume ›' : 'Enter ›'}
                </Link>
              ) : (
                <Link className="poenter is-muted" href="/membership">
                  Unlock ›
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </>
  )
}
