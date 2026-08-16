import { route } from '@/lib/http/handler'
import { issuePlaybackTicket } from '@/lib/services/playback'
import { clientIp } from '@/lib/http/rate-limit'
import { uuid } from '@/lib/validation/schemas'

/**
 * POST /api/v1/lessons/:id/playback
 *
 * POST rather than GET, and this is not pedantry: it makes the response
 * uncacheable by CDNs and browsers by default. A short-lived playback
 * credential sitting in a shared cache is the exact failure this endpoint
 * exists to prevent.
 *
 * Consumed identically by the website and the Expo app.
 */
export const POST = route({ auth: 'student', limit: 'playback' }, async ({ ctx, params, req }) =>
  issuePlaybackTicket(ctx!, uuid.parse(params.id), clientIp(req)),
)
