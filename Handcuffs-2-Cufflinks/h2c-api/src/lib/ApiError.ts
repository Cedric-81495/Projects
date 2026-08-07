/**
 * Errors intended for the client.
 *
 * Anything thrown that is not an ApiError is treated as unexpected: it gets
 * logged in full and reported as a generic 500, so internal details such as
 * stack traces or driver messages never reach the browser.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;
  /** Expected conditions (401, 404) are logged at debug rather than error. */
  readonly expected: boolean;

  constructor(
    status: number,
    message: string,
    options: { code?: string; fieldErrors?: Record<string, string[]>; expected?: boolean } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.expected = options.expected ?? status < 500;
  }

  static badRequest(message: string, fieldErrors?: Record<string, string[]>): ApiError {
    return new ApiError(400, message, { code: 'BAD_REQUEST', fieldErrors });
  }

  static unauthorized(message = 'You need to sign in to do that.'): ApiError {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'You do not have access to this area.'): ApiError {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'That record does not exist.'): ApiError {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message, { code: 'CONFLICT' });
  }

  static tooMany(message = 'Too many requests. Try again shortly.'): ApiError {
    return new ApiError(429, message, { code: 'RATE_LIMITED' });
  }

  static internal(message = 'Something went wrong on our end.'): ApiError {
    return new ApiError(500, message, { code: 'INTERNAL', expected: false });
  }
}
