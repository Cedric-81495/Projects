import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { LEVELS } from '@/lib/access/policy'
import { ChangePasswordForm } from './ChangePasswordForm'

export const metadata: Metadata = { title: 'Account · GWOP University' }
export const dynamic = 'force-dynamic'

/**
 * ACCOUNT.
 *
 * Reached from the initial disc in the portal bar. Until now that disc was
 * decorative — it sat inside the sign-out form and did nothing when tapped,
 * which is the first thing anyone tries.
 *
 * Password change lives here rather than at /update-password. That route exists
 * for the reset-link flow and is entered without a session; this one is for
 * someone already signed in. They share the same server action, because
 * `supabase.auth.updateUser` behaves identically in both cases.
 */


/* One date format for the whole page, so "Member since" and the level dates
   cannot drift apart. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

/* enrollment_source is an enum: purchase, subscription, manual_grant,
   scholarship, founding_member, event_offer. Only the first is a sale, and
   calling the rest "Purchased" would be wrong in a place a student may quote
   back during a billing question. */
function sourceLabel(source: string): string {
  switch (source) {
    case 'purchase':
    case 'subscription':
      return 'Purchased'
    case 'founding_member':
      return 'Founding member access from'
    case 'event_offer':
      return 'Event access from'
    default:
      /* manual_grant, scholarship, and anything added to the enum later. */
      return 'Access granted'
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   describeAccess — what the student actually owns, in words

   ⚠ "AND BELOW" WAS WRONG AND IS NOT COMING BACK. It dates from when access was
   cumulative. Under per-level access (migration 0014) every combination is
   possible, and the four that matter read very differently:

     bought Level 4 only    → "Level 4"                 NOT "Level 4 and below"
     bought 1 and 3         → "Levels 1 and 3"          NOT "Level 3 and below"
     bought the bundle      → "All four levels"
     bought nothing yet     → "No levels yet"

   The old wording told a Level 4 buyer they owned all four — the exact claim
   the $500-per-sale access defect made, still being made in copy after the
   defect itself was fixed. Someone reading it would reasonably open a support
   ticket when Level 2 stayed locked.

   The bundle is named rather than listed because "Levels 1, 2, 3 and 4" reads
   like four separate purchases; "All four levels" is what they bought.
   ═══════════════════════════════════════════════════════════════════════════ */
function describeAccess(owned: number[]): string {
  if (owned.length === 0) return 'No levels yet'
  if (owned.length === LEVELS.length) return 'All four levels'

  const names = owned.map((n) => LEVELS.find((l) => l.level === n)?.label ?? `Level ${n}`)
  if (names.length === 1) return names[0]

  /* "Levels 1, 2 and 3" — the labels already say "Level N", so the numbers are
     pulled out to avoid "Level 1, Level 2 and Level 3". */
  const numbers = owned.join(', ').replace(/, (\d+)$/, ' and $1')
  return `Levels ${numbers}`
}

export default async function AccountPage() {
  const supabase = await createServerSupabase()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login?next=/account')
  const user = userData.user

  /* ⚠ enrolled_levels, NOT max_enrolled_level. A single number cannot describe
     what someone owns: a student holding Levels 1 and 3 has a max of 3, and
     this page used to render that as "Level 3 and below" — telling them they
     own Level 2, which they do not and which the database will refuse.

     max_enrolled_level still exists for "how far have you got" copy elsewhere.
     It is not an access answer and must not be used as one here. */
  const [{ data: profile }, { data: levels }, { data: rows }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.rpc('enrolled_levels', { uid: user.id }),
    /* ⚠ starts_at, NOT created_at. created_at is when the row was written;
       starts_at is when access actually began, and the two differ whenever an
       enrollment is backdated or re-granted after a support fix. The student
       cares about the second one.

       Readable directly because RLS policy "read own enrollments" scopes it to
       auth.uid() — no RPC needed, and no admin client. `source` comes along so
       a level that was granted rather than bought is not labelled a purchase. */
    supabase
      .from('enrollments')
      .select('level, starts_at, source, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('level'),
  ])

  const owned = (Array.isArray(levels) ? (levels as number[]) : []).slice().sort((a, b) => a - b)

  type EnrollmentRow = { level: number; starts_at: string; source: string; expires_at: string | null }
  const enrollments = (rows ?? []) as EnrollmentRow[]

  return (
    <section className="acct">
      <p className="tag">Your account</p>
      <h1 className="h2">{profile?.full_name || 'Account'}</h1>

      <dl className="acct-facts">
        <div>
          <dt>Email</dt>
          {/* Not editable. Changing an auth email requires confirming both the
              old and new address, and getting that flow wrong locks someone out
              of their own account. Support handles it until it is built
              properly. */}
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Access</dt>
          <dd>{describeAccess(owned)}</dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>
{formatDate(user.created_at)}
          </dd>
        </div>
      </dl>

      {/* ── WHEN EACH LEVEL OPENED ────────────────────────────────────────────
          One line per level rather than a single date, because under per-level
          access the levels are bought separately and often months apart. A
          bundle buyer sees four rows with the same date, which is correct and
          reads as one purchase; a ladder buyer sees their actual history.

          `source` is shown when it is not a purchase. Someone who was granted
          a level by support, or given it as a founding member, should not see
          it described as something they bought — and if they ever query a
          charge, this is the line that answers it. */}
      {enrollments.length > 0 && (
        <>
          <h2 className="acct-h">Your levels</h2>
          <dl className="acct-facts">
            {enrollments.map((e) => (
              <div key={e.level}>
                <dt>{LEVELS.find((l) => l.level === e.level)?.label ?? `Level ${e.level}`}</dt>
                <dd>
                  {sourceLabel(e.source)} {formatDate(e.starts_at)}
                  {e.expires_at ? ` · expires ${formatDate(e.expires_at)}` : ''}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <h2 className="acct-h">Change password</h2>
      <ChangePasswordForm />

      <p className="acct-note">
        Signing out ends the session on every device, not just this one.
      </p>
    </section>
  )
}
