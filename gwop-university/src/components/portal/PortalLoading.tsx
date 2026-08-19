/**
 * LOADING STATE for the signed-in routes.
 *
 * Both /app/* and /dashboard are `force-dynamic` and wait on two Supabase calls
 * in their layout — the role lookup and `max_enrolled_level`. On venue cellular
 * that is a real pause with nothing on screen, so Next needs a Suspense fallback
 * to put there.
 *
 * Deliberately NOT used on /830. That page is statically prerendered and paints
 * immediately, so a spinner there would have nothing to cover and would itself
 * become the flash it was meant to prevent.
 *
 * Server component — no state, no effects, so it ships no JavaScript. The
 * animation is pure CSS.
 *
 * The skeleton rows are sized to the dashboard's real content rather than being
 * generic bars, so the layout does not jump when the data arrives.
 */
export function PortalLoading() {
  return (
    <div className="poload" role="status" aria-live="polite">
      {/* aria-hidden on the visual: a screen reader gets the text below instead
          of announcing a decorative spinner and three empty boxes. */}
      <div className="poload-spin" aria-hidden="true" />
      <p className="poload-msg">Loading your blueprint…</p>

      <div className="poload-rows" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {/* sr-only, because "Loading your blueprint" above is decorative text
          inside an aria-live region — this is the announced string. */}
      <span className="sr-only">Loading your course content, please wait.</span>
    </div>
  )
}