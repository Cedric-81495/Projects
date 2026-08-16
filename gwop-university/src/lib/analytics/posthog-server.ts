import 'server-only'
import { PostHog } from 'posthog-node'
import { publicEnv } from '@/lib/env'
import { sanitizeProps, type AnalyticsEvent } from './events'

/**
 * Server-side capture — used for events the browser cannot be trusted to
 * report, above all `purchase_completed`, which is fired from the Stripe
 * webhook. A client-fired purchase event is unverifiable and will not match
 * Stripe's own numbers.
 */
let client: PostHog | null = null

function posthog(): PostHog | null {
  if (!publicEnv.NEXT_PUBLIC_POSTHOG_KEY) return null
  client ??= new PostHog(publicEnv.NEXT_PUBLIC_POSTHOG_KEY, {
    host: publicEnv.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
  return client
}

export async function captureServer(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
) {
  const ph = posthog()
  if (!ph) return
  ph.capture({ distinctId, event, properties: sanitizeProps(properties) })
  await ph.flush()
}
