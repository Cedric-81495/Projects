import 'server-only'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { ok, fail } from './respond'
import { ApiError } from './errors'
import { enforceLimit, limitHeaders, clientIp, type LimitName } from './rate-limit'
import { getAuthContext, requireRole, type AuthContext, type AppRole } from '@/lib/auth/context'
import { logger } from '@/lib/observability/logger'

/**
 * The single wrapper every API route goes through.
 *
 * Centralising this is the difference between "we rate limit our API" and "we
 * rate limit the four routes somebody remembered to add it to". A new endpoint
 * gets request IDs, limits, auth, body validation, timing and a safe error
 * boundary by construction, not by discipline.
 */

interface RouteConfig<TBody, TQuery> {
  /** 'public' allows anonymous callers; a role name requires at least that role. */
  auth: 'public' | 'optional' | AppRole
  limit: LimitName
  /** Limit per user when authenticated, falling back to IP. Default true. */
  limitByUser?: boolean
  body?: z.ZodType<TBody>
  query?: z.ZodType<TQuery>
}

interface HandlerArgs<TBody, TQuery> {
  req: Request
  ctx: AuthContext | null
  body: TBody
  query: TQuery
  params: Record<string, string>
  requestId: string
}

export function route<TBody = undefined, TQuery = undefined>(
  config: RouteConfig<TBody, TQuery>,
  handler: (args: HandlerArgs<TBody, TQuery>) => Promise<unknown>,
) {
  // Next 15 types the second argument as a required context object whose
  // `params` is a Promise. Declaring it optional makes the generated route
  // types fail to typecheck, so it is required here even for static segments.
  return async (req: Request, context: { params: Promise<Record<string, string>> }) => {
    const requestId = req.headers.get('x-request-id') ?? randomUUID()
    const startedAt = Date.now()

    try {
      // 1. Authenticate first, so the rate limit can be keyed to a user.
      let ctx: AuthContext | null = null
      if (config.auth === 'public' || config.auth === 'optional') {
        ctx = await getAuthContext(req)
        // 'public' tolerates anonymous; 'optional' is the same but signals intent.
      } else {
        ctx = await requireRole(req, config.auth)
      }

      // 2. Rate limit.
      const identifier =
        config.limitByUser !== false && ctx ? `u:${ctx.userId}` : `ip:${clientIp(req)}`
      const limit = await enforceLimit(config.limit, identifier)

      // 3. Validate input. Query first — it is cheaper to reject.
      const url = new URL(req.url)
      const query = config.query
        ? config.query.parse(Object.fromEntries(url.searchParams))
        : (undefined as TQuery)

      let body = undefined as TBody
      if (config.body) {
        const raw = await req.json().catch(() => {
          throw new ApiError(400, 'validation_failed', 'Request body must be valid JSON.')
        })
        body = config.body.parse(raw)
      }

      const params = (await context?.params) ?? {}

      // 4. Run.
      const result = await handler({ req, ctx, body, query, params, requestId })

      logger.info('request_ok', {
        requestId,
        method: req.method,
        path: url.pathname,
        userId: ctx?.userId,
        channel: ctx?.channel,
        ms: Date.now() - startedAt,
      })

      return ok(result, {
        headers: { 'X-Request-Id': requestId, ...limitHeaders(config.limit, limit) },
      })
    } catch (error) {
      logger.warn('request_failed', {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        code: error instanceof ApiError ? error.code : 'unknown',
        ms: Date.now() - startedAt,
      })
      return fail(error, requestId)
    }
  }
}
