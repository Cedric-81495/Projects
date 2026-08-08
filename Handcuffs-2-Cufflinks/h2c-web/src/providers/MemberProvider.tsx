import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiPost, setMemberAccessToken } from '@/lib/api/client';
import { MemberContext } from './context/member';
import type { MemberContextValue, PublicMember, RegisterInput } from './context/member';

/**
 * Community member session.
 *
 * Deliberately separate from AuthProvider, which handles staff. They use
 * different endpoints, different cookies, and different token audiences, so a
 * member session can never be mistaken for a CMS session.
 *
 * The token lives in the api client's dedicated member slot, in memory only.
 * The client picks which token to send based on the request path, so a member
 * token can never travel to a staff endpoint.
 */
interface SessionResponse {
  member: PublicMember;
  accessToken: string;
}

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<PublicMember | null>(null);
  const [status, setStatus] = useState<MemberContextValue['status']>('loading');

  // Restore the session from the refresh cookie on load.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await apiPost<SessionResponse>('/members/refresh');
        if (cancelled) return;
        setMemberAccessToken(session.accessToken);
        setMember(session.member);
        setStatus('signed-in');
      } catch {
        if (cancelled) return;
        setMemberAccessToken(null);
        setMember(null);
        setStatus('anonymous');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback((session: SessionResponse) => {
    setMemberAccessToken(session.accessToken);
    setMember(session.member);
    setStatus('signed-in');
  }, []);

  const register = useCallback(
    async (input: RegisterInput) => {
      adopt(await apiPost<SessionResponse>('/members/register', input));
    },
    [adopt]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      adopt(await apiPost<SessionResponse>('/members/sign-in', { email, password }));
    },
    [adopt]
  );

  const signOut = useCallback(async () => {
    try {
      await apiPost('/members/sign-out');
    } finally {
      setMemberAccessToken(null);
      setMember(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<MemberContextValue>(
    () => ({ member, status, register, signIn, signOut }),
    [member, status, register, signIn, signOut]
  );

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}
