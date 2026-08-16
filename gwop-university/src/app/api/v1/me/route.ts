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

  const { data: enrollments } = await ctx!.db
    .from('enrollments')
    .select('level, source, status, starts_at, expires_at')
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
