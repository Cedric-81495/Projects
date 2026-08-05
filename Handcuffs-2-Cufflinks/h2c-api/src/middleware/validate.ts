import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from './errorHandler.js';

/** Validate req.body against a zod schema; replaces body with the parsed value. */
export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(' ');
      return next(new HttpError(400, message || 'Invalid request.'));
    }
    req.body = result.data;
    next();
  };
}
