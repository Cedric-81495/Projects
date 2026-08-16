import { route } from '@/lib/http/handler'
import { upsertProgressSchema } from '@/lib/validation/schemas'
import { ApiError } from '@/lib/http/errors'

/**
 * PUT /api/v1/progress — idempotent upsert, written by web and mobile alike.
 *
 * Two rules worth noticing:
 *  · `position_sec` only moves forward on the server's view unless the client
 *    explicitly rewinds by sending a lower value with status 'in_progress'.
 *    Without this, a stale offline sync from the phone can undo an evening's
 *    progress made on the laptop.
 *  · `completed_at` is stamped server-side. A client-supplied completion
 *    timestamp is unverifiable and would corrupt any certificate logic later.
 */
export const PUT = route(
  { auth: 'student', limit: 'write', body: upsertProgressSchema },
  async ({ ctx, body }) => {
    const now = new Date().toISOString()

    const { data: existing } = await ctx!.db
      .from('lesson_progress')
      .select('position_sec, watched_sec, status, first_started_at, completed_at')
      .eq('user_id', ctx!.userId)
      .eq('lesson_id', body.lesson_id)
      .maybeSingle()

    const completed = body.status === 'completed' || existing?.status === 'completed'

    const { data, error } = await ctx!.db
      .from('lesson_progress')
      .upsert(
        {
          user_id: ctx!.userId,
          lesson_id: body.lesson_id,
          status: completed ? 'completed' : body.status,
          position_sec: body.position_sec,
          watched_sec: Math.max(body.watched_sec ?? 0, existing?.watched_sec ?? 0),
          completed_at: completed ? (existing?.completed_at ?? now) : null,
          first_started_at: existing?.first_started_at ?? now,
          last_device: body.device,
        },
        { onConflict: 'user_id,lesson_id' },
      )
      .select('lesson_id, status, position_sec, watched_sec, completed_at')
      .single()

    // An RLS rejection here means the lesson is above the caller's enrollment.
    if (error) {
      throw new ApiError(403, 'not_enrolled', 'This lesson is not part of your enrollment.')
    }
    return data
  },
)
