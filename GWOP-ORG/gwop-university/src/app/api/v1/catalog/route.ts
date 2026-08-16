import { route } from '@/lib/http/handler'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/catalog — the four-level pathway, plus what the caller can open.
 *
 * Public: the marketing site renders it for anonymous visitors and the Expo app
 * renders the same shape with `unlocked` populated. One endpoint, two clients,
 * no divergent copy.
 *
 * Locked levels return metadata and counts but no lesson list. That a level
 * exists is the upsell; what is inside it is the product.
 */
export const GET = route({ auth: 'public', limit: 'read' }, async ({ ctx }) => {
  const db = ctx?.db ?? (await createServerSupabase())
  const enrolled = ctx?.enrolledLevel ?? 0

  const [{ data: levels }, { data: courses }, { data: modules }, { data: lessons }] =
    await Promise.all([
      db.from('university_levels').select('level, slug, label, role_label, goal, detail, sku').order('level'),
      db.from('courses').select('id, level, slug, title, summary, sort_order').eq('published', true).order('sort_order'),
      db.from('modules').select('id, course_id, level, slug, title, sort_order').eq('published', true).order('sort_order'),
      db.from('lessons').select('id, level').eq('published', true),
    ])

  return {
    levels: (levels ?? []).map((l) => ({
      ...l,
      unlocked: l.level <= enrolled,
      lessonCount: (lessons ?? []).filter((x) => x.level === l.level).length,
      courses: (courses ?? [])
        .filter((c) => c.level === l.level)
        .map((c) => ({ ...c, modules: (modules ?? []).filter((m) => m.course_id === c.id) })),
    })),
    enrolledLevel: enrolled,
  }
})
