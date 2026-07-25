// Base URL for the backend. In dev, Vite's proxy (see vite.config.ts) forwards
// /api/* to http://localhost:4000, so this can stay empty locally.
// In production, set VITE_API_URL to the deployed Express server's origin.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface ApiOptions extends RequestInit {
  skipRetry?: boolean;
}

/**
 * Wrapper around fetch that:
 * - always sends cookies (for the future httpOnly JWT auth)
 * - retries once via /api/auth/refresh on a 401
 * - throws on non-2xx so callers can just try/catch
 *
 * Right now the backend doesn't exist yet, so calls will fail with a
 * network error until the Express server is running on :4000 — that's
 * expected at this stage. Build the UI against this function now; nothing
 * changes on the frontend once the server is real.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipRetry, ...init } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && !skipRetry) {
    const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      return apiFetch<T>(path, { ...options, skipRetry: true });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  // Some endpoints (e.g. logout) return no body.
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
