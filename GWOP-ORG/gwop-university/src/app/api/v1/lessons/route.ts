import { route } from '@/lib/http/handler'
import { listLessonsQuery } from '@/lib/validation/schemas'

/**
 * GET /api/v1/lessons?module=…&level=…
 *
 * Note what is NOT here: a `.lte('level', ctx.enrolledLevel)` filter. The RLS
 * policy already refuses rows above the caller's enrollment. Filtering again in
 * the query would obscure the fact that the policy is doing the work — and the
 * day someone "optimises" the filter away, access would silently widen.
 */
export const GET = route(
  { auth: 'student', limit: 'read', query: listLessonsQuery },
  async ({ ctx, query }) => {
    let q = ctx!.db
      .from('lessons')
      .select('id, module_id, level, slug, title, description, kind, sort_order, duration_sec, is_preview, is_capstone')
      .eq('published', true)
      .order('level')
      .order('sort_order')
      .limit(query.limit)

    if (query.module) q = q.eq('module_id', query.module)
    if (query.level) q = q.eq('level', query.level)
    if (query.cursor) q = q.gt('id', query.cursor)

    const { data, error } = await q
    if (error) throw error

    const { data: progress } = await ctx!.db
      .from('lesson_progress')
      .select('lesson_id, status, position_sec, completed_at')
      .eq('user_id', ctx!.userId)

    const byLesson = new Map((progress ?? []).map((p) => [p.lesson_id, p]))

    return {
      lessons: (data ?? []).map((l) => ({
        ...l,
        progress: byLesson.get(l.id) ?? { status: 'not_started', position_sec: 0 },
      })),
      nextCursor: data && data.length === query.limit ? data[data.length - 1].id : null,
    }
  },
)
