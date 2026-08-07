import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, setAccessToken } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { can } from '@/types/auth';
import { AuthContext } from './context/auth';
import type { AuthContextValue } from './context/auth';
import type { AdminUser, AuthSession, Permission, SignInPayload } from '@/types/auth';

/**
 * Session handling for the CMS.
 *
 * The access token lives in memory only (see lib/api/client) and the refresh
 * token is an httpOnly cookie the JavaScript never sees. On mount we ask the
 * API who we are rather than trusting anything stored client-side, so a
 * tampered localStorage value cannot fake an admin session.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await apiGet<AdminUser>(API.auth.me);
        if (!cancelled) {
          setUser(me);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('anonymous');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (payload: SignInPayload) => {
    const session = await apiPost<AuthSession>(API.auth.signIn, payload);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiPost(API.auth.signOut);
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signIn,
      signOut,
      hasPermission: (permission: Permission) => can(user, permission),
    }),
    [user, status, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

