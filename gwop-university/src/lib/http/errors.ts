/**
 * One error shape for the entire API, so the website and the mobile app parse
 * failures identically:
 *
 *   { "error": { "code": "not_enrolled", "message": "…", "details": {…} },
 *     "requestId": "…" }
 *
 * `code` is a stable machine string the clients switch on. `message` is safe to
 * show a user. Internal detail never crosses this boundary.
 */
export type ErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_enrolled'
  | 'not_found'
  | 'validation_failed'
  | 'rate_limited'
  | 'conflict'
  | 'payment_required'
  | 'upstream_unavailable'
  | 'internal_error'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const notFound = (what = 'Resource') =>
  new ApiError(404, 'not_found', `${what} not found.`)

export const conflict = (message: string) => new ApiError(409, 'conflict', message)
