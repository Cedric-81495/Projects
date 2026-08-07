import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MongoServerError } from 'mongodb';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';
import type { ErrorEnvelope } from '@/lib/envelope';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route matches ${req.method} ${req.path}`));
};

/**
 * Terminal error handler.
 *
 * Only ApiError messages reach the client. Anything else — a driver error, a
 * bug, a bad cast — is logged in full and reported as a generic 500, because
 * database errors leak schema details and stack traces leak file paths.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    apiError = ApiError.badRequest('Some fields need attention.', fieldErrors);
  } else if (err instanceof mongoose.Error.ValidationError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, issue] of Object.entries(err.errors)) {
      (fieldErrors[key] ??= []).push(issue.message);
    }
    apiError = ApiError.badRequest('Some fields need attention.', fieldErrors);
  } else if (err instanceof mongoose.Error.CastError) {
    apiError = ApiError.badRequest('That identifier is not valid.');
  } else if (isBodyParserError(err, 'entity.too.large')) {
    // body-parser rejects oversized payloads before any handler runs. Without
    // this branch it surfaced as a generic 500, which reads as a server bug
    // rather than "your request was too big".
    apiError = new ApiError(413, 'That request is too large.', { code: 'PAYLOAD_TOO_LARGE' });
  } else if (isBodyParserError(err, 'entity.parse.failed')) {
    apiError = ApiError.badRequest('The request body is not valid JSON.');
  } else if (err instanceof MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'value';
    apiError = ApiError.conflict(`That ${field} is already in use.`);
  } else {
    apiError = ApiError.internal();
  }

  const context = {
    err: apiError.expected ? { message: (err as Error).message } : err,
    method: req.method,
    path: req.path,
    status: apiError.status,
    actor: req.actor?.email,
  };

  if (apiError.expected) logger.debug(context, 'request rejected');
  else logger.error(context, 'unhandled error');

  const body: ErrorEnvelope = {
    success: false,
    message: apiError.message,
    ...(apiError.code ? { code: apiError.code } : {}),
    ...(apiError.fieldErrors ? { errors: apiError.fieldErrors } : {}),
  };

  res.status(apiError.status).json(body);
};

/** body-parser tags its failures with a `type` rather than a distinct class. */
function isBodyParserError(err: unknown, type: string): boolean {
  return typeof err === 'object' && err !== null && (err as { type?: string }).type === type;
}
