import type { Entity } from './common';

/**
 * RBAC. The guide specifies two operational roles: a Super Administrator and
 * Admins (the VAs who publish content). Permissions are enumerated rather than
 * inferred from the role name so a third role can be added without touching
 * every component.
 */
export type Role = 'super-admin' | 'admin';

export type Permission =
  | 'content:read'
  | 'content:write'
  | 'content:publish'
  | 'content:delete'
  | 'media:upload'
  | 'media:delete'
  | 'community:moderate'
  | 'subscribers:read'
  | 'subscribers:export'
  | 'analytics:read'
  | 'kmm:manage'
  | 'gwop:manage'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:read';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'super-admin': [
    'content:read',
    'content:write',
    'content:publish',
    'content:delete',
    'media:upload',
    'media:delete',
    'community:moderate',
    'subscribers:read',
    'subscribers:export',
    'analytics:read',
    'kmm:manage',
    'gwop:manage',
    'users:manage',
    'settings:manage',
    'audit:read',
  ],
  // VAs publish and moderate. They cannot manage users, delete records,
  // export subscriber lists, or read the audit log.
  admin: [
    'content:read',
    'content:write',
    'content:publish',
    'media:upload',
    'community:moderate',
    'subscribers:read',
    'analytics:read',
    'kmm:manage',
    'gwop:manage',
  ],
};

export interface AdminUser extends Entity {
  fullName: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  avatarUrl?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AdminUser;
  accessToken: string;
  expiresAt: string;
}

export function can(user: AdminUser | null, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role].includes(permission);
}
