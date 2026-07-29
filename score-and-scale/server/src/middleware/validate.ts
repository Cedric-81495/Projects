import type { NextFunction, Request, Response } from 'express'
import { z, type ZodTypeAny } from 'zod'
import { badRequest } from '../lib/errors'

type Source = 'body' | 'query' | 'params'

/**
 * Replaces the raw request segment with the parsed result, so handlers receive
 * stripped, coerced, fully typed input and can never read an unvalidated
 * field by accident.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const fieldErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
      next(badRequest('VALIDATION_ERROR', 'Some of the details provided are not valid.', fieldErrors))
      return
    }

    if (source === 'body') req.body = result.data
    else if (source === 'params') req.params = result.data as Request['params']
    else Object.defineProperty(req, 'query', { value: result.data, configurable: true })

    next()
  }
}

/** Rejects anything that is not a Mongo ObjectId before it reaches a query. */
export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid id')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})
