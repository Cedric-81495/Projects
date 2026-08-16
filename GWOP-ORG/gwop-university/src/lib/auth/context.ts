import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabase, createBearerSupabase } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { ApiError } from '@/lib/http/errors'

export type AppRole = 'student' | 'staff' | 'admin' | 'owner'

export const ROLE_RANK: Record<AppRole, number> = {
  student: 10,
  staff: 20,
  admin: 30,
  owner: 40,
}

export interface AuthContext {
  userId: string
  email: string
  roles: AppRole[]
  role: AppRole // highest held
  enrolledLevel: number // 0–4
  db: SupabaseClient<Database> // RLS-bound, use this for all queries
  channel: 'web' | 'mobile'
}

/**
 * Resolves a caller regardless of which client they came from.
 *
 * Website  → session cookies set by @supabase/ssr
 * Mobile   → `Authorization: Bearer <access_token>` from the native SDK
 *
 * Both end up with a Supabase client whose JWT drives the same RLS policies, so
 * there is exactly one authorization implementation and it lives in Postgres.
 *
 * Returns null for anonymous callers rather than throwing — public endpoints
 * (the marketing catalogue, preview modules) legitimately have no session.
 */
export async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('authorization')
  const bearer = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  const db = bearer ? createBearerSupabase(bearer) : await createServerSupabase()
  const channel: AuthContext['channel'] = bearer ? 'mobile' : 'web'

  // getUser() re-validates the JWT against the auth server. getSession() only
  // decodes it locally and is trivially forgeable from the client, so it is
  // never used for an authorization decision.
  const { data: userData, error } = await db.auth.getUser()
  if (error || !userData.user) return null

  const [{ data: roleRows }, { data: level }] = await Promise.all([
    db.from('user_roles').select('role').eq('user_id', userData.user.id),
    db.rpc('max_enrolled_level', { uid: userData.user.id }),
  ])

  const roles = (roleRows?.map((r) => r.role) ?? ['student']) as AppRole[]
  const role = roles.reduce<AppRole>(
    (best, r) => (ROLE_RANK[r] > ROLE_RANK[best] ? r : best),
    'student',
  )

  return {
    userId: userData.user.id,
    email: userData.user.email ?? '',
    roles,
    role,
    enrolledLevel: typeof level === 'number' ? level : 0,
    db,
    channel,
  }
}

/** Require any authenticated caller. */
export async function requireAuth(req: Request): Promise<AuthContext> {
  const ctx = await getAuthContext(req)
  if (!ctx) throw new ApiError(401, 'unauthenticated', 'Sign in to continue.')
  return ctx
}

/** Require a minimum role. Server-side only — hiding a nav link is not this. */
export async function requireRole(req: Request, minimum: AppRole): Promise<AuthContext> {
  const ctx = await requireAuth(req)
  if (ROLE_RANK[ctx.role] < ROLE_RANK[minimum]) {
    throw new ApiError(403, 'forbidden', 'You do not have access to this resource.')
  }
  return ctx
}

/**
 * Require entitlement to a level.
 *
 * This is a defence-in-depth check, not the primary one — RLS already refuses
 * to return the rows. It exists so the API returns a clean, actionable 403
 * ("upgrade to open Junior") instead of an ambiguous empty list, which is a
 * much better experience on mobile.
 */
export async function requireLevel(req: Request, level: number): Promise<AuthContext> {
  const ctx = await requireAuth(req)
  if (ctx.enrolledLevel < level) {
    throw new ApiError(403, 'not_enrolled', 'This level is not part of your enrollment yet.', {
      requiredLevel: level,
      currentLevel: ctx.enrolledLevel,
    })
  }
  return ctx
}
