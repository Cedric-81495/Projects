const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface ApiOptions extends RequestInit {
  skipRetry?: boolean;
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Shared across all callers so concurrent 401s trigger ONE /refresh call,
// not one per caller. This is what was producing the racing/aborted
// refresh requests — every component that hit a 401 at roughly the same
// time (AuthContext init, a protected fetch, etc.) was firing its own
// independent POST /auth/refresh.
let refreshInFlight: Promise<boolean> | null = null;

function doRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

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
    const body = await res.clone().json().catch(() => ({}));

    // Only a TOKEN_EXPIRED cookie is worth refreshing. NOT_AUTHENTICATED
    // means there was never a session (a plain guest on the funnel page,
    // for example) — calling /refresh in that case is guaranteed to 401
    // again and was the source of the extra noisy failed request.
    if (body.code === 'TOKEN_EXPIRED') {
      const refreshed = await doRefresh();
      if (refreshed) {
        return apiFetch<T>(path, { ...options, skipRetry: true });
      }
      throw new ApiError('Your session has expired. Please sign in again.', 'SESSION_EXPIRED', 401);
    }

    throw new ApiError(body.error ?? 'Not authenticated', body.code ?? 'NOT_AUTHENTICATED', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request failed: ${res.status}`, body.code ?? 'UNKNOWN_ERROR', res.status);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
