/**
 * Every error the API returns carries a stable machine-readable `code`
 * alongside its HTTP status. The client switches on the code (never on the
 * human-readable message), so copy can change without breaking behaviour.
 */
export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (code: string, message: string, details?: unknown) =>
  new AppError(400, code, message, details)

export const unauthorized = (code: string, message: string) => new AppError(401, code, message)

export const forbidden = (code: string, message: string) => new AppError(403, code, message)

export const notFound = (code: string, message: string) => new AppError(404, code, message)

export const conflict = (code: string, message: string) => new AppError(409, code, message)

/**
 * Raised when a route depends on an integration whose credentials are absent.
 * Distinct from a 500 so operators can tell misconfiguration from a real bug.
 */
export const integrationUnavailable = (integration: string) =>
  new AppError(
    503,
    'INTEGRATION_NOT_CONFIGURED',
    `${integration} is not configured on this environment.`,
  )
