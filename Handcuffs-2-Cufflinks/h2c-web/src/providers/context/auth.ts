import { createContext, useContext } from 'react';
import type { AdminUser, Permission, SignInPayload } from '@/types/auth';

export interface AuthContextValue {
  user: AdminUser | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
