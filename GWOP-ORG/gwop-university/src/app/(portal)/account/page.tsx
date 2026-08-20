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
export default async function AccountPage() {
  const supabase = await createServerSupabase()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login?next=/account')
  const user = userData.user

  const [{ data: profile }, { data: enrolled }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.rpc('max_enrolled_level', { uid: user.id }),
  ])

  const level = typeof enrolled === 'number' ? enrolled : 0
  const current = LEVELS.find(l => l.level === level)

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
          <dd>
            {current
              ? `${current.label} and below`
              : 'No level unlocked yet'}
          </dd>
        </div>
        <div>
          <dt>Member since</dt>
          <dd>
            {new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </dd>
        </div>
      </dl>

      <h2 className="acct-h">Change password</h2>
      <ChangePasswordForm />

      <p className="acct-note">
        Signing out ends the session on every device, not just this one.
      </p>
    </section>
  )
}
