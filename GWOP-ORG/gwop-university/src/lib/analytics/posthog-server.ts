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

  /* Analytics must never be able to fail the request it is reporting on.
     `flush()` performs a real network call, so anything from a wrong host to a
     PostHog outage makes it reject — and because this is awaited inside the
     sign-in server action, that rejection surfaced to the user as
     "Application error: a server-side exception has occurred" immediately after
     a SUCCESSFUL login. The auth cookie was already set, which is why a refresh
     then worked and made it look intermittent.

     The specific trigger was NEXT_PUBLIC_POSTHOG_HOST defaulting to
     `http://localhost:3000/ingest` in the deployed environment, so the server
     was posting to itself. Setting the variable fixes that instance; this
     try/catch is what stops the next one from logging anyone out of a working
     login. */
  try {
    ph.capture({ distinctId, event, properties: sanitizeProps(properties) })
    await ph.flush()
  } catch {
    /* Intentionally swallowed. A dropped analytics event is a reporting gap; a
       thrown one is an outage. */
  }
} 