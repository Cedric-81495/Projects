/**
 * Admin API client — sends the httpOnly auth cookie via credentials: 'include'.
 * Separate from the public apiClient because only admin calls are credentialed.
 */
import { API_BASE, isApiConfigured, ApiError } from './apiClient';

export type Submission = {
  _id: string;
  name: string;
  email: string;
  title: string;
  story: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export type Admin = { email: string; role: 'admin' };

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError('Admin requires a backend. Set VITE_API_URL.', 0);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${path.replace(/^\/+/, '')}`, {
      credentials: 'include',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    });
  } catch {
    throw new ApiError('Could not reach the server.', 0);
  }
  const text = await res.text();
  const payload = text ? safeJson(text) : null;
  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as Record<string, unknown>).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }
  return payload as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const adminApi = {
  login: (email: string, password: string) =>
    adminFetch<{ ok: true; admin: Admin }>('admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => adminFetch<{ ok: true }>('admin/logout', { method: 'POST' }),
  me: () => adminFetch<{ admin: Admin }>('admin/me'),
  listSubmissions: (status: 'pending' | 'approved' | 'rejected' = 'pending') =>
    adminFetch<{ data: Submission[] }>(`admin/community/stories?status=${status}`),
  moderate: (id: string, status: 'approved' | 'rejected') =>
    adminFetch<{ data: Submission }>(`admin/community/stories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // ── Content CRUD (stories | episodes | tracks) ──
  listContent: <T = ContentDoc>(resource: ContentResource) =>
    adminFetch<{ data: T[] }>(`admin/${resource}`),
  createContent: (resource: ContentResource, body: Record<string, unknown>) =>
    adminFetch<{ data: ContentDoc }>(`admin/${resource}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateContent: (resource: ContentResource, id: string, body: Record<string, unknown>) =>
    adminFetch<{ data: ContentDoc }>(`admin/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteContent: (resource: ContentResource, id: string) =>
    adminFetch<{ ok: true }>(`admin/${resource}/${id}`, { method: 'DELETE' }),
};

export type ContentResource = 'stories' | 'episodes' | 'tracks';
export type ContentDoc = {
  _id: string;
  slug: string;
  published?: boolean;
  order?: number;
  [key: string]: unknown;
};
