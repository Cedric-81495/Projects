import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { env } from '../lib/env'
import { AppError } from '../lib/errors'
import { logger } from '../lib/logger'

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.path}` })
}

/**
 * Single exit point for every failure.
 *
 * Known failures keep their code and message. Everything else is logged in
 * full server-side but reduced to an opaque INTERNAL_ERROR for the client, so
 * stack traces, driver messages, and query fragments never reach the browser.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof AppError) {
    // 5xx AppErrors are still operational problems worth logging.
    if (error.status >= 500) {
      logger.error(error.message, { code: error.code, path: req.path, method: req.method })
    }
    res.status(error.status).json({
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
    return
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Some of the details provided are not valid.',
      details: Object.entries(error.errors).map(([field, issue]) => ({
        field,
        message: issue.message,
      })),
    })
    return
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ code: 'INVALID_ID', message: 'That identifier is not valid.' })
    return
  }

  // Duplicate key — surfaced without echoing the offending value back.
  if (typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000) {
    res.status(409).json({ code: 'DUPLICATE_KEY', message: 'That record already exists.' })
    return
  }

  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Something went wrong on our end. Please try again.',
    ...(env.isProduction
      ? {}
      : { debug: error instanceof Error ? error.message : String(error) }),
  })
}

/**
 * Wraps an async handler so a rejected promise reaches Express's error
 * pipeline. Express 4 does not await handlers, so without this an async throw
 * becomes an unhandled rejection and the request hangs.
 */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  handler: T,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next)
  }
}
