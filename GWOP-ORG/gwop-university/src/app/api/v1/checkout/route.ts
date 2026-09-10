import { headers } from 'next/headers'
import { route } from '@/lib/http/handler'
import { createCheckoutSchema } from '@/lib/validation/schemas'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { currentAck } from '@/config/purchase'
import { ApiError } from '@/lib/http/errors'

export const POST = route(
  { auth: 'student', limit: 'checkout', body: createCheckoutSchema },
  async ({ ctx, body }) => {
    const ack = currentAck()

    /* ⚠ THE VERSION MUST MATCH WHAT THE SERVER IS CURRENTLY SHOWING.

       The browser tells us which wording it rendered. If it does not match the
       current one, the tab is stale — the wording changed after the page
       loaded. Recording agreement to a superseded sentence is worse than
       failing: it produces a record that looks valid and is not.

       409 rather than 422: nothing the buyer typed is wrong, the page is out
       of date. The client reloads and they see the current wording. */
    if (body.ack_version !== ack.version) {
      /* ⚠ 'conflict', not a new code. ErrorCode in lib/http/errors.ts is a
         closed union and 'conflict' is exactly what a 409 means here — the
         request is well-formed, the client's view of the world is out of date.
         Widening the union for one call site would make every consumer of
         ErrorCode handle a case that means the same thing. The specifics go in
         `details`, which is what it is for. */
      throw new ApiError(
        409,
        'conflict',
        'The purchase terms have been updated. Please reload the page and review them again.',
        { reason: 'stale_acknowledgement', expected: ack.version },
      )
    }

    /* Captured here rather than in checkout.ts because request headers are
       only available in the route. Same shape as the SMS consent record on
       `leads`, deliberately — one pattern for both, so a dispute and a consent
       query read alike. */
    const h = await headers()
    const ip =
      h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

    return createCheckoutSession(ctx!, body, {
      text: ack.text,
      version: ack.version,
      ip: ip && ip !== '0.0.0.0' ? ip : null,
      userAgent: h.get('user-agent')?.slice(0, 500) ?? null,
    })
  },
)