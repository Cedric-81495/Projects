import { route } from '@/lib/http/handler'
import { createCheckoutSchema } from '@/lib/validation/schemas'
import { createCheckoutSession } from '@/lib/stripe/checkout'

/**
 * POST /api/v1/checkout — returns a Stripe Checkout URL.
 *
 * Both clients open this URL in a browser (mobile uses an in-app browser /
 * ASWebAuthenticationSession rather than a webview, which is both an App Store
 * requirement and better for the customer's saved-card autofill).
 *
 * Access is NOT granted here. This endpoint's only job is to start a payment.
 * The webhook decides whether anything was bought.
 */
export const POST = route(
  { auth: 'student', limit: 'checkout', body: createCheckoutSchema },
  async ({ ctx, body }) => createCheckoutSession(ctx!, body),
)
