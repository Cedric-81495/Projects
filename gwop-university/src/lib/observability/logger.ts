import 'server-only'

/**
 * Structured JSON logging with PII scrubbing.
 *
 * Anything matching a key in REDACT is replaced before serialisation. This
 * matters more than it sounds: a lead payload logged at debug level puts a real
 * person's phone number into a third-party log retention system, and that is a
 * compliance problem regardless of intent.
 */
const REDACT = new Set([
  'password', 'token', 'access_token', 'refresh_token', 'authorization', 'apikey',
  'secret', 'phone', 'phone_e164', 'email', 'consent_ip', 'ip', 'card', 'client_secret',
])

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1))
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      REDACT.has(k.toLowerCase()) ? [k, '[redacted]'] : [k, scrub(v, depth + 1)],
    ),
  )
}

type Level = 'debug' | 'info' | 'warn' | 'error'

function emit(level: Level, event: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...(context ? (scrub(context) as Record<string, unknown>) : {}),
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (event: string, ctx?: Record<string, unknown>) => emit('debug', event, ctx),
  info: (event: string, ctx?: Record<string, unknown>) => emit('info', event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit('warn', event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit('error', event, ctx),
}
