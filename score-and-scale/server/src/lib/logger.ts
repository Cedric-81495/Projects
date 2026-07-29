import { env } from './env'

type Level = 'debug' | 'info' | 'warn' | 'error'

const SENSITIVE_KEY = /pass|secret|token|key|authorization|cookie|nonce/i

/**
 * Redacts credential-shaped values before anything reaches stdout. Render
 * retains logs, so a leaked secret in a log line is a real disclosure.
 */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) return value.map((entry) => redact(entry, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : redact(entry, depth + 1)
  }
  return out
}

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (level === 'debug' && env.isProduction) return

  const line = {
    level,
    time: new Date().toISOString(),
    message,
    ...(context ? { context: redact(context) } : {}),
  }

  const serialised = JSON.stringify(line)
  if (level === 'error') console.error(serialised)
  else if (level === 'warn') console.warn(serialised)
  else console.log(serialised)
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
}
