import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { PortalChrome } from '@/components/portal/PortalChrome'
import type { AccessState } from '@/lib/access/policy'
import '@/styles/portal.css'

export const dynamic = 'force-dynamic' // never statically cache a signed-in shell

/**
 * ONE server-side guard for every portal route.
 *
 * Because this is a route-group layout, adding a page under (portal) inherits
 * the guard automatically — it is not possible to ship an unguarded portal page
 * by forgetting a check. That is the whole reason the route group exists.
 *
 * ⚠ This guard is a REDIRECT, for user experience. The security guarantee is
 *   the RLS policy in 0006_rls.sql. If this layout were deleted tomorrow the
 *   data would still be safe; the pages would just render empty.
 *
 * getUser() re-validates the JWT against the auth server. getSession() only
 * decodes it locally and is forgeable from the client — never use it here.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login?next=/dashboard')

  const [{ data: roles }, { data: level }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userData.user.id),
    supabase.rpc('max_enrolled_level', { uid: userData.user.id }),
  ])

  const rank = { student: 10, staff: 20, admin: 30, owner: 40 } as const
  const role = (roles ?? [{ role: 'student' }]).reduce(
    (best, r) => (rank[r.role as keyof typeof rank] > rank[best as keyof typeof rank] ? r.role : best),
    'student' as string,
  ) as AccessState['role']

  const access: AccessState = {
    userId: userData.user.id,
    role,
    enrolledLevel: typeof level === 'number' ? level : 0,
  }

  return (
    <PortalChrome access={access} email={userData.user.email ?? ''}>
      {children}
    </PortalChrome>
  )
}
