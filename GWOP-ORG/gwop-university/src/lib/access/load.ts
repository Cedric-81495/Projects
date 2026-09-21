import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { AccessState } from '@/lib/access/policy'

/* ═══════════════════════════════════════════════════════════════════════════
   ONE PLACE THAT ANSWERS "WHO IS THIS AND WHAT MAY THEY OPEN"

   ⚠ WHY THIS EXISTS — 2026-09-21. Four call sites built AccessState by hand:
   (portal)/layout.tsx, app/layout.tsx, (portal)/dashboard/page.tsx,
   app/[level]/page.tsx and api/v1/asset/route.ts. Two of them resolved the
   caller's real role. Three hard-coded `role: 'student'`.

   The result a user actually saw: an admin's nav rendered the ADMIN link,
   because PortalChrome had the real role — while the dashboard beneath it said
   "You're not enrolled yet" and showed all four levels locked, because that
   page had decided everyone was a student. Meanwhile the `staff read all
   lessons` RLS policy would happily have returned those lessons. Three layers,
   three answers, about one person.

   ⚠ THE DASHBOARD'S OLD COMMENT ARGUED THE LITERAL WAS SAFE, and on its own
   terms it was: the page only decides whether to draw a card, and every query
   runs through the RLS-bound client, so nothing leaked. That reasoning is
   sound about SECURITY and wrong about CORRECTNESS. A page that tells a
   reviewer their content is locked, next to a nav that says they are an
   admin, is a page nobody can trust — and the next person to read it cannot
   tell which half is the bug.

   So: resolve it once, here, and let policy.ts decide what the answer means.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Mirrors public.current_role_rank() in 0002_identity_access.sql. Kept as a
   rank rather than an equality check because has_role() is a rank comparison
   in the database too — an admin satisfies a staff test there, and must here.
   ⚠ IF A ROLE IS ADDED TO THE app_role ENUM, ADD IT HERE IN THE SAME COMMIT.
   An unknown role scores undefined, loses every comparison, and silently
   degrades that person to a student. */
const RANK = { student: 10, staff: 20, admin: 30, owner: 40 } as const

export function highestRole(
  rows: ReadonlyArray<{ role: string }> | null | undefined,
): AccessState['role'] {
  return (rows ?? []).reduce<AccessState['role']>((best, r) => {
    const candidate = RANK[r.role as keyof typeof RANK] ?? 0
    const current = RANK[best as keyof typeof RANK] ?? 0
    return candidate > current ? (r.role as AccessState['role']) : best
  }, 'student')
}

/**
 * Everything the access rules need about the signed-in caller.
 *
 * Returns null when nobody is signed in, so the caller decides between a
 * redirect and a 404 rather than having that decided for it — the portal
 * redirects, the asset route 404s, and both are right for their context.
 *
 * ⚠ THE CLIENT MUST BE THE RLS-BOUND ONE, never the admin client. Every query
 * here is scoped by policy, not by a `where` clause, so handing it a
 * service-role client would return another user's rows without complaining.
 */
export async function loadAccessState(
  supabase: SupabaseClient<Database>,
): Promise<AccessState | null> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  if (!user) return null

  /* ⚠ BOTH RPCs, AND THEY ARE NOT INTERCHANGEABLE. enrolled_levels is the
     access decision — a set. max_enrolled_level is display only, "how far have
     you got", and using it to gate is the defect 0014 existed to remove. */
  const [{ data: roles }, { data: enrolled }, { data: levels }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase.rpc('max_enrolled_level', { uid: user.id }),
    supabase.rpc('enrolled_levels', { uid: user.id }),
  ])

  return {
    userId: user.id,
    role: highestRole(roles),
    enrolledLevel: typeof enrolled === 'number' ? enrolled : 0,
    /* ⚠ ALWAYS AN ARRAY, NEVER undefined. canAccessLevel() falls back to the
       old `enrolledLevel >= level` comparison when this is missing, and that
       fallback is deliberately permissive — it would show a Level 3 buyer that
       they own Levels 1 and 2. Passing [] means "owns nothing", which is the
       truth for somebody with no enrollments. */
    enrolledLevels: Array.isArray(levels) ? (levels as number[]) : [],
  }
}
