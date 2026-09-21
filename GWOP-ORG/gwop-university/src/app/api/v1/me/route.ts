import { route } from '@/lib/http/handler'
import { updateProfileSchema } from '@/lib/validation/schemas'
import { ApiError } from '@/lib/http/errors'

/**
 * GET /api/v1/me — everything a client needs to render the member shell in one
 * round trip: identity, role, enrollments and per-level progress.
 *
 * Deliberately one call. On a phone at a booth, four sequential requests over
 * cellular is a visibly slower app than one.
 */
export const GET = route({ auth: 'student', limit: 'read' }, async ({ ctx }) => {
  const { data: profile } = await ctx!.db
    .from('profiles')
    .select('id, email, full_name, phone_e164, marketing_opt_in, onboarded_at, created_at')
    .eq('id', ctx!.userId)
    .single()

  /* ⚠ .eq('user_id') ADDED 2026-09-21. This relied on RLS alone, which is
     correct for a student — "read own enrollments" pins user_id to auth.uid().
     But that same policy also permits has_role('staff'), so a staff account
     calling /me received EVERY user's enrollment rows inside their own profile
     response. Never exploited, and not a leak to customers, but this endpoint
     answers "who am I" and it was answering "who is everyone".

     RLS stays the gate; this is the query saying what it actually wants. */
  const { data: enrollments } = await ctx!.db
    .from('enrollments')
    .select('level, source, status, starts_at, expires_at')
    .eq('user_id', ctx!.userId)
    .eq('status', 'active')
    .order('level')

  const progress = await Promise.all(
    [1, 2, 3, 4].map(async (level) => {
      const { data } = await ctx!.db.rpc('level_progress', {
        p_level: level,
        uid: ctx!.userId,
      })
      const row = data?.[0] ?? { total: 0, completed: 0, percent: 0 }
      return { level, ...row }
    }),
  )

  return {
    profile,
    role: ctx!.role,
    roles: ctx!.roles,
    enrolledLevel: ctx!.enrolledLevel,
    enrollments: enrollments ?? [],
    progress,
  }
})

/** PATCH /api/v1/me — the only fields a user may change about themselves. */
export const PATCH = route(
  { auth: 'student', limit: 'write', body: updateProfileSchema },
  async ({ ctx, body }) => {
    const { data, error } = await ctx!.db
      .from('profiles')
      .update({
        ...(body.full_name !== undefined && { full_name: body.full_name }),
        ...(body.phone !== undefined && { phone_e164: body.phone }),
        ...(body.marketing_opt_in !== undefined && { marketing_opt_in: body.marketing_opt_in }),
      })
      .eq('id', ctx!.userId) // belt and braces; the RLS policy also pins this
      .select('id, email, full_name, phone_e164, marketing_opt_in')
      .single()

    if (error) throw new ApiError(422, 'validation_failed', 'Could not save those changes.')
    return data
  },
)
