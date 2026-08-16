import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ApiError } from './errors'
import { logger } from '@/lib/observability/logger'

export interface Envelope<T> {
  data: T
  meta?: Record<string, unknown>
}

export function ok<T>(
  data: T,
  init?: { status?: number; headers?: HeadersInit; meta?: Record<string, unknown> },
) {
  return NextResponse.json<Envelope<T>>(
    { data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200, headers: init?.headers },
  )
}

/**
 * Converts anything thrown inside a handler into a safe response.
 *
 * The default branch is deliberately opaque: an unexpected exception returns
 * "Something went wrong" plus a request ID. Stack traces, driver errors and
 * constraint names go to the log, never to the client — a raw Postgres error
 * will happily tell an attacker your table and column names.
 */
export function fail(error: unknown, requestId: string) {
  const headers = { 'X-Request-Id': requestId }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details }, requestId },
      { status: error.status, headers },
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'validation_failed',
          message: 'Some fields need attention.',
          details: {
            fields: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          },
        },
        requestId,
      },
      { status: 422, headers },
    )
  }

  logger.error('unhandled_error', {
    requestId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })

  return NextResponse.json(
    { error: { code: 'internal_error', message: 'Something went wrong. Try again.' }, requestId },
    { status: 500, headers },
  )
}
