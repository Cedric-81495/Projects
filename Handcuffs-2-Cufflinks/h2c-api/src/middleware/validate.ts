import type { Request, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Request validation.
 *
 * The parsed result replaces the original, so handlers only ever see data that
 * matched the schema — unknown keys are stripped rather than passed through to
 * a Mongoose update, which is what turns a stray field into mass assignment.
 */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    // Assigned to a separate field rather than req.query: Express 5 exposes
    // query through a getter only, and overwriting it throws.
    req.validatedQuery = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return next(result.error);
    next();
  };
}

/** Typed accessor for whatever validateQuery stored. */
export function query<T>(req: Request): T {
  return (req.validatedQuery ?? {}) as T;
}
