/**
 * RBAC.
 *
 * This enum is mirrored in the frontend (src/types/auth.ts). The two must stay
 * identical — but note the frontend copy is a usability aid only. This file is
 * the security boundary: every protected route checks the permission here,
 * independently of whatever the browser believes.
 */
export const ROLES = ['super-admin', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
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
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  'super-admin': PERMISSIONS,
  /**
   * VAs publish and moderate. They deliberately cannot manage users, delete
   * records, export subscriber lists, or read the audit log — the four actions
   * that are either irreversible or expose the whole audience list.
   */
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

export function roleHas(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
