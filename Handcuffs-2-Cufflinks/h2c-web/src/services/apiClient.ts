/**
 * Thin, typed fetch wrapper for the H2C backend.
 *
 * Design goals:
 *  - One place that knows the API base URL (from VITE_API_URL).
 *  - Never throws an unstructured error: callers get a typed ApiError.
 *  - Timeout + JSON handling built in.
 *  - `isApiConfigured()` lets UI/data code degrade gracefully to seed data
 *    when no backend is wired yet (e.g. the static-only preview deploy).
 */

const RAW_BASE = import.meta.env.VITE_API_URL?.trim() ?? '';
/** Base URL without a trailing slash, e.g. "https://api.example.com/api". */
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

/** True when a real backend base URL has been provided at build time. */
export function isApiConfigured(): boolean {
  return API_BASE.length > 0;
}

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = {
  /** Milliseconds before the request is aborted. Default 12s. */
  timeoutMs?: number;
  signal?: AbortSignal;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError('API base URL is not configured (VITE_API_URL).', 0);
  }

  const { timeoutMs = 12_000, signal } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Bridge an externally provided signal to our controller.
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const url = `${API_BASE}/${path.replace(/^\/+/, '')}`;

  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const payload = text ? safeJson(text) : null;

    if (!res.ok) {
      const message =
        (payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as Record<string, unknown>).message)
          : null) ?? `Request failed (${res.status})`;
      throw new ApiError(message, res.status, payload);
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 0);
    }
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0, err);
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body, opts),
};
