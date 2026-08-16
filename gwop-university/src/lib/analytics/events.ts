/**
 * PostHog event taxonomy (§18).
 *
 * A closed union rather than free-form strings, because analytics dashboards
 * quietly rot when someone ships `module_open` alongside `module_opened`.
 *
 * ⚠ PII RULE: property values here are IDs, slugs, levels and counts. Never an
 *   email, phone number, full name, address or payment detail. `distinct_id`
 *   is the Supabase user UUID — pseudonymous, and the only identifier that
 *   crosses to PostHog. Shared verbatim with the Expo app so web and mobile
 *   funnels are actually comparable.
 */

export const ANALYTICS_EVENTS = {
  pageView: 'page_view',
  signupStarted: 'signup_started',
  signupCompleted: 'signup_completed',
  login: 'login',
  membershipViewed: 'membership_viewed',
  checkoutStarted: 'checkout_started',
  purchaseCompleted: 'purchase_completed',
  moduleOpened: 'module_opened',
  lessonOpened: 'lesson_opened',
  videoStarted: 'video_started',
  videoCompleted: 'video_completed',
  moduleCompleted: 'module_completed',
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

/** Only these property keys are permitted. Anything else is dropped. */
export interface AnalyticsProps {
  level?: number
  level_slug?: string
  course_slug?: string
  module_slug?: string
  lesson_slug?: string
  plan_sku?: string
  amount_cents?: number
  currency?: string
  duration_sec?: number
  percent?: number
  source?: string
  platform?: 'web' | 'ios' | 'android'
}

const ALLOWED = new Set<keyof AnalyticsProps>([
  'level', 'level_slug', 'course_slug', 'module_slug', 'lesson_slug',
  'plan_sku', 'amount_cents', 'currency', 'duration_sec', 'percent',
  'source', 'platform',
])

/** Belt and braces: strips anything not on the allow-list before it leaves. */
export function sanitizeProps(props: Record<string, unknown> = {}): AnalyticsProps {
  return Object.fromEntries(
    Object.entries(props).filter(([k]) => ALLOWED.has(k as keyof AnalyticsProps)),
  ) as AnalyticsProps
}
