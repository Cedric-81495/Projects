/**
 * CENTRALIZED AUTHORIZATION (§13).
 *
 * Every membership and role rule expressed in TypeScript lives here. React
 * components import from this file; they never compare a level number, never
 * check `role === 'admin'`, and never decide access inline. The moment access
 * logic is spread across components, changing a rule means auditing the whole
 * component tree — which is how a stale check survives into production.
 *
 * ⚠ IMPORTANT: this module governs *affordances*, not security.
 *   The guarantee is the RLS policy in supabase/migrations/0006_rls.sql. This
 *   layer exists so the UI can grey out a locked lesson and the API can return
 *   an actionable "upgrade to open Junior" instead of an ambiguous empty list.
 *   If these two ever disagree, the database wins and this file is the bug.
 *
 * Imported unchanged by the future Expo app.
 */

export const ROLES = ['student', 'staff', 'admin', 'owner'] as const
export type AppRole = (typeof ROLES)[number]

const ROLE_RANK: Record<AppRole, number> = { student: 10, staff: 20, admin: 30, owner: 40 }

/* ⚠ `label` IS WHAT THE PORTAL NAV AND PathwayRail RENDER, and it was missed
   by 0013. That migration renamed university_levels, courses and (in 0016)
   membership_plans — but this constant is hardcoded, so the student area kept
   showing FRESHMAN / SOPHOMORE / JUNIOR / SENIOR while every other surface
   said Level 1-4.

   ⚠ `slug` AND `sku` DO NOT CHANGE. The slugs are the level_slug enum, the
   /app/[level] URLs students have bookmarked, and the 0007 course slugs. The
   SKUs are matched by seed-stripe.mts and by Stripe product metadata already
   created against them. A display name and an identifier are allowed to
   differ — that is what `label` is for.

   Kept short here on purpose: this renders in a horizontal nav bar and a
   compact rail, so "Level 1" fits where "Level 1 — Personal Credit" would
   wrap. The full title lives in content/pathway.ts as `title`. */
export const LEVELS = [
  { level: 1, slug: 'freshman', label: 'Level 1', sku: 'GWOPU-FRESHMAN' },
  { level: 2, slug: 'sophomore', label: 'Level 2', sku: 'GWOPU-SOPHOMORE' },
  { level: 3, slug: 'junior', label: 'Level 3', sku: 'GWOPU-JUNIOR' },
  { level: 4, slug: 'senior', label: 'Level 4', sku: 'GWOPU-SENIOR' },
] as const

export type LevelSlug = (typeof LEVELS)[number]['slug']

/** What the API and UI both receive to make access decisions. */
export interface AccessState {
  userId: string
  role: AppRole
  /**
   * Highest level the caller holds. 0 = enrolled in nothing.
   *
   * ⚠ FOR DISPLAY ONLY SINCE 2026-09-08. This is "how far have they got" —
   * progress rings, "you have reached Level 3", the membership page. It is NOT
   * the access decision any more, because access is per-level: someone who
   * buys Level 1 and Level 3 has a max of 3 and no entitlement to Level 2, so
   * a single number cannot describe them.
   */
  enrolledLevel: number
  /**
   * The levels actually held, ascending. This is the access decision.
   *
   * Optional so the ~9 call sites that only need the display number do not all
   * have to change at once. When absent, canAccessLevel() falls back to the
   * old `>= level` comparison — which is wrong under per-level access, so any
   * path that gates content MUST populate this. See the note there.
   */
  enrolledLevels?: readonly number[]
  /** Present only when the enrollment is time-limited. */
  expiresAt?: string | null
}

export const ANONYMOUS: AccessState = { userId: '', role: 'student', enrolledLevel: 0 }

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export const hasRole = (state: AccessState, minimum: AppRole): boolean =>
  ROLE_RANK[state.role] >= ROLE_RANK[minimum]

export const isStaff = (s: AccessState) => hasRole(s, 'staff')
export const isAdmin = (s: AccessState) => hasRole(s, 'admin')

// ---------------------------------------------------------------------------
// Level access
// ---------------------------------------------------------------------------

export const levelBySlug = (slug: string) => LEVELS.find((l) => l.slug === slug)

/**
 * Access is CUMULATIVE: buying Junior opens Freshman and Sophomore too. This
 * matches `CAPABILITIES.upgradeToHigherLevel` in config/membership.ts.
 *
 * Staff and above can open every level for content review — that is a role
 * grant, not an enrollment, and it is mirrored by the "staff read all lessons"
 * RLS policy so the two layers agree.
 */
export function canAccessLevel(state: AccessState, level: number): boolean {
  if (isStaff(state)) return true

  /* ⚠ SET MEMBERSHIP, NOT >=. Changed 2026-09-08 to match the RLS policy in
     0014_per_level_access.sql — the two layers have to agree or the UI shows a
     lesson the database will refuse to return.

     Surpaul's memo §6 has purchase order free and the bundle granting all
     four. Under `>=`, buying Level 4 alone granted every level, which made his
     "$1,388 if purchased separately" unreachable and the $997 bundle worse
     value than a $497 purchase.

     ⚠ THE FALLBACK IS DELIBERATELY THE OLD BEHAVIOUR, AND IT IS PERMISSIVE.
     A caller that has not been updated to pass `enrolledLevels` keeps the old
     `>=` comparison rather than being denied everything — because denying
     everything would take the student area down for all four levels the moment
     this deploys, and RLS still refuses the rows underneath.

     That means the fallback FAILS OPEN in the UI and closed in the database.
     Acceptable only because the database is the real gate. If you find a path
     showing a locked lesson as available, that path is missing
     enrolledLevels — populate it rather than tightening this. */
  if (state.enrolledLevels) return state.enrolledLevels.includes(level)
  return state.enrolledLevel >= level
}

export interface LessonLike {
  level: number
  published: boolean
  isPreview?: boolean
}

export function canAccessLesson(state: AccessState, lesson: LessonLike): boolean {
  if (!lesson.published) return isStaff(state)
  if (lesson.isPreview) return true
  return canAccessLevel(state, lesson.level)
}

/**
 * Why a lesson is locked, so the UI can say something useful instead of
 * "Locked". Copy for each reason lives in the content files, not here.
 */
export type LockReason = 'none' | 'sign_in_required' | 'upgrade_required' | 'expired' | 'unpublished'

export function lockReason(
  state: AccessState,
  lesson: LessonLike,
  isAuthenticated: boolean,
): LockReason {
  if (!lesson.published) return 'unpublished'
  if (lesson.isPreview) return 'none'
  if (!isAuthenticated) return 'sign_in_required'
  if (canAccessLevel(state, lesson.level)) return 'none'
  if (state.expiresAt && new Date(state.expiresAt) <= new Date()) return 'expired'
  return 'upgrade_required'
}

/** The lowest plan that would unlock this level — drives the upgrade CTA. */
export function requiredSkuFor(level: number): string | null {
  return LEVELS.find((l) => l.level === level)?.sku ?? null
}

/** Next level to sell, or null when the student already holds everything. */
export function nextUpgradeLevel(state: AccessState): number | null {
  const next = state.enrolledLevel + 1
  return next <= 4 ? next : null
}
