// ============================================================
// Auth & admin service — talks to the backend directly (never the
// local seed). Reuses the shared `http` helper, which sends the
// session cookie via credentials:'include'.
// ============================================================
import { http } from '@/services/content';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  tier: 'member' | 'vip';
  bio: string;
  location: string;
  interests: string[];
  memberSince?: string;
  lastLoginAt?: string;
}

// ---------- Member auth ----------
export const googleLogin = (credential: string) =>
  http<{ user: AuthUser }>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });

export const fetchMe = () => http<{ user: AuthUser }>('/auth/me');

export const logoutMember = () => http<{ ok: boolean }>('/auth/logout', { method: 'POST' });

export type ProfilePatch = Partial<Pick<AuthUser, 'name' | 'bio' | 'location' | 'interests'>>;
export const updateProfile = (patch: ProfilePatch) =>
  http<{ user: AuthUser }>('/auth/me', { method: 'PATCH', body: JSON.stringify(patch) });

// ---------- Member profile ----------
export interface Submission {
  id: string;
  title: string;
  story: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}
export interface ProfileData {
  user: AuthUser;
  stats: { submissions: number; approved: number; pending: number };
  submissions: Submission[];
}
export const getMyProfile = () => http<ProfileData>('/me/profile');

export const submitMyStory = (payload: { title: string; story: string }) =>
  http<{ ok: boolean }>('/me/stories', { method: 'POST', body: JSON.stringify(payload) });

// ---------- Admin auth ----------
export const adminLogin = (email: string, password: string) =>
  http<{ ok: boolean; admin: { email: string; role: string } }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const adminMe = () => http<{ admin: { email: string; role: string } }>('/admin/me');

export const adminLogout = () => http<{ ok: boolean }>('/admin/logout', { method: 'POST' });

// ---------- Admin: dashboard ----------
export interface AdminStats {
  users: number;
  admins: number;
  suspended: number;
  pendingStories: number;
  approvedStories: number;
  publishedStories: number;
  episodes: number;
  tracks: number;
  members: number;
  newsletter: number;
}
export const getAdminStats = () =>
  http<{ stats: AdminStats; recentUsers: AuthUser[] }>('/admin/stats');

// ---------- Admin: users ----------
export interface AdminUserList {
  data: AuthUser[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
export const getAdminUsers = (q: {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
}) => {
  const p = new URLSearchParams();
  if (q.search) p.set('search', q.search);
  if (q.status) p.set('status', q.status);
  if (q.role) p.set('role', q.role);
  if (q.page) p.set('page', String(q.page));
  const qs = p.toString();
  return http<AdminUserList>(`/admin/users${qs ? `?${qs}` : ''}`);
};

export const updateAdminUser = (
  id: string,
  patch: { role?: 'user' | 'admin'; status?: 'active' | 'suspended'; tier?: 'member' | 'vip' },
) => http<{ user: AuthUser }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteAdminUser = (id: string) =>
  http<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' });

// ---------- Admin: community moderation ----------
export interface ModStory {
  _id: string;
  name: string;
  email: string;
  title: string;
  story: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
export const getModStories = (status?: string) =>
  http<{ data: ModStory[] }>(`/admin/community/stories${status ? `?status=${status}` : ''}`);

export const moderateStory = (id: string, status: 'approved' | 'rejected') =>
  http<{ data: ModStory }>(`/admin/community/stories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
