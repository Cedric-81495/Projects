import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { PortalChrome } from '@/components/portal/PortalChrome'
import type { AccessState } from '@/lib/access/policy'
import '@/styles/portal.css'

export const dynamic = 'force-dynamic' // never statically cache a signed-in shell

/**
 * GUARD + SHELL FOR /app/*.
 *
 * Why this file exists: `(portal)` is a route group, so its layout only wraps
 * routes physically inside that folder — which was `/dashboard` alone. The
 * course routes live at `src/app/app/**`, outside the group, so they rendered
 * with no shell at all. A student on /app/freshman/module-3 had no way to reach
 * the dashboard, switch level, or sign out; the only chrome was the marketing
 * crest, which links to `/`.
 *
 * Middleware already redirects anonymous visitors away from /app, and RLS is
 * the actual security guarantee (0006_rls.sql). This layout is here for the
 * shell and for a second redirect that keeps the pages from rendering empty if
 * middleware is ever narrowed.
 *
 * The access-state derivation is deliberately identical to (portal)/layout.tsx.
 * It is duplicated rather than shared because extracting it is a refactor
 * touching a live signed-in path, and CLAUDE.md §12 says not to refactor beyond
 * the task. Worth extracting into lib/access/server.ts after Aug 30 — noting it
 * here so the duplication is a recorded decision rather than an oversight.
 *
 * getUser() re-validates the JWT against the auth server. getSession() only
 * decodes it locally and is forgeable from the client — never use it here.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) redirect('/login?next=/app')

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