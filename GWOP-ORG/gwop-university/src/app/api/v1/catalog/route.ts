import { route } from '@/lib/http/handler'
import { createServerSupabase } from '@/lib/supabase/server'
import { canAccessLevel, ANONYMOUS, type AccessState } from '@/lib/access/policy'

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

  /* ⚠ enrolledLevels, NOT `level <= enrolledLevel`. FIXED 2026-09-26.
     This read `unlocked: l.level <= enrolled`, which is max_enrolled_level —
     a display value. Someone holding Level 3 alone was shown Levels 1, 2 and 3
     as unlocked, and RLS then returned nothing for 1 and 2: the exact "path
     showing a locked lesson as available" that canAccessLevel() warns about.

     It matters more here than anywhere else, because this endpoint is the
     Expo app's entire level list. A wrong flag here is a wrong app. */
  const access: AccessState = ctx
    ? {
        userId: ctx.userId,
        role: ctx.role,
        enrolledLevel: ctx.enrolledLevel,
        enrolledLevels: ctx.enrolledLevels,
      }
    : ANONYMOUS

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
      /* Staff resolve true here via canAccessLevel's role check, which matches
         the "staff read all lessons" RLS policy — the two layers agree. */
      unlocked: canAccessLevel(access, l.level),
      lessonCount: (lessons ?? []).filter((x) => x.level === l.level).length,
      courses: (courses ?? [])
        .filter((c) => c.level === l.level)
        .map((c) => ({ ...c, modules: (modules ?? []).filter((m) => m.course_id === c.id) })),
    })),
    /* Display value — progress rings, "you have reached Level 3". */
    enrolledLevel: enrolled,
    /* ⚠ The access decision, added for the Expo app. A client that renders a
       level list needs the set, not the maximum. */
    enrolledLevels: ctx?.enrolledLevels ?? [],
  }
})
