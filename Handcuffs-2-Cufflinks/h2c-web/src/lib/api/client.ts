import { env } from '@/config/env';
import type { ApiEnvelope, ApiErrorShape } from '@/types/common';

/**
 * API client for the Express backend.
 *
 * Built on fetch rather than a client library. The stack permits either, and
 * the only features needed here — a base URL, an auth header, and one silent
 * refresh-and-retry — are about forty lines. On a mobile-first site whose
 * audience may be on metered data, that is worth roughly 19KB gzip on every
 * page load.
 *
 * Auth uses an httpOnly refresh cookie plus a short-lived access token held in
 * memory only. Nothing sensitive touches localStorage, so an XSS bug cannot
 * walk away with a session.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Thrown for any non-2xx response. Carries field errors for form display. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method: Method;
  body?: unknown;
  params?: Record<string, unknown>;
  /** Internal: prevents a refresh loop. */
  retried?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  // env.siteUrl is used as the base so a relative apiBaseUrl resolves without
  // reading window, which does not exist during the prerender build.
  const base = typeof window === 'undefined' ? env.siteUrl : window.location.origin;
  const url = new URL(`${env.apiBaseUrl.replace(/\/$/, '')}${path}`, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** A single in-flight refresh is shared, so parallel 401s cause one round trip. */
let refreshInFlight: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new ApiError('Session expired.', response.status);
      const payload = (await response.json()) as ApiEnvelope<{ accessToken: string }>;
      setAccessToken(payload.data.accessToken);
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method,
      credentials: 'include',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch {
    // Status 0 means the request never reached the server. Callers use this to
    // distinguish "offline or API not deployed" from a real rejection.
    throw new ApiError('Could not reach the server.', 0);
  }

  // One silent refresh attempt, then give up and surface the error.
  if (
    response.status === 401 &&
    !options.retried &&
    !path.startsWith('/auth/')
  ) {
    try {
      await refreshSession();
      return request<T>(path, { ...options, retried: true });
    } catch {
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    let body: ApiErrorShape | undefined;
    try {
      body = (await response.json()) as ApiErrorShape;
    } catch {
      // Non-JSON error page, e.g. a proxy timeout.
    }
    throw new ApiError(
      body?.message ?? 'The request could not be completed.',
      response.status,
      body?.code,
      body?.errors
    );
  }

  if (response.status === 204) return undefined as T;

  // Unwraps the { success, data } envelope so callers work with plain data.
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export const apiGet = <T>(path: string, params?: Record<string, unknown>): Promise<T> =>
  request<T>(path, { method: 'GET', params });

export const apiPost = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body });

export const apiPatch = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: 'PATCH', body });

export const apiDelete = <T>(path: string): Promise<T> =>
  request<T>(path, { method: 'DELETE' });
