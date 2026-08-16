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

export const LEVELS = [
  { level: 1, slug: 'freshman', label: 'Freshman', sku: 'GWOPU-FRESHMAN' },
  { level: 2, slug: 'sophomore', label: 'Sophomore', sku: 'GWOPU-SOPHOMORE' },
  { level: 3, slug: 'junior', label: 'Junior', sku: 'GWOPU-JUNIOR' },
  { level: 4, slug: 'senior', label: 'Senior', sku: 'GWOPU-SENIOR' },
] as const

export type LevelSlug = (typeof LEVELS)[number]['slug']

/** What the API and UI both receive to make access decisions. */
export interface AccessState {
  userId: string
  role: AppRole
  /** Highest level the caller may open. 0 = enrolled in nothing. */
  enrolledLevel: number
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
