const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

/** Carries the server's machine-readable code so callers can switch on it. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: { field: string; message: string }[]

  constructor(
    status: number,
    code: string,
    message: string,
    details?: { field: string; message: string }[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * CSRF token, held in memory only.
 *
 * The API sets its session cookies on the Render domain, which this origin
 * cannot read, so the token is delivered in the body of /login, /refresh and
 * /me and echoed back as a header. Memory rather than localStorage is
 * deliberate: it keeps the value out of reach of any XSS that can read storage,
 * and a reload recovers it from /me anyway.
 */
let csrfToken: string | null = null

export function setCsrfToken(token: string | null): void {
  csrfToken = token
}

/**
 * A single shared refresh promise.
 *
 * Without it, a dashboard that fires several requests at once would send
 * several parallel /refresh calls. Because refresh tokens rotate, the second
 * call presents a token the first has already replaced — which the server
 * correctly reads as token reuse and revokes the whole session. Funnelling
 * every caller through one promise is what prevents that self-inflicted logout.
 */
let refreshPromise: Promise<boolean> | null = null

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** Internal: suppresses the retry-after-refresh path. */
  skipRefresh?: boolean
}

async function parseBody(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    // A non-JSON body means a proxy or platform error page, not our API.
    return { code: 'BAD_RESPONSE', message: text.slice(0, 200) }
  }
}

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) return false

      const body = await parseBody(response)
      if (typeof body.csrfToken === 'string') setCsrfToken(body.csrfToken)
      return true
    } catch {
      return false
    } finally {
      // Cleared so a later 401 can start a fresh attempt.
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, skipRefresh = false } = options

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  // Only mutating requests are CSRF-checked, so the header is only sent there.
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken

  const response = await fetch(`${API_URL}${path}`, {
    method,
    // Required for the httpOnly session cookies to travel cross-site.
    credentials: 'include',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
  })

  if (response.ok) {
    const parsed = await parseBody(response)
    if (typeof parsed.csrfToken === 'string') setCsrfToken(parsed.csrfToken)
    return parsed as T
  }

  const errorBody = await parseBody(response)
  const code = typeof errorBody.code === 'string' ? errorBody.code : 'UNKNOWN_ERROR'
  const message =
    typeof errorBody.message === 'string' ? errorBody.message : 'Something went wrong.'

  /**
   * Refresh is attempted only for TOKEN_EXPIRED — never for a generic 401.
   *
   * NOT_AUTHENTICATED means a guest with no session, and trying to refresh that
   * produces a pointless round trip on every anonymous page view.
   */
  if (code === 'TOKEN_EXPIRED' && !skipRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipRefresh: true })
    }
  }

  throw new ApiError(
    response.status,
    code,
    message,
    Array.isArray(errorBody.details)
      ? (errorBody.details as { field: string; message: string }[])
      : undefined,
  )
}

export { API_URL }
