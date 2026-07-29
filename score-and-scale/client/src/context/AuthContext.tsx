import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { apiFetch, ApiError } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  sessionMessage: string | null;
  clearSessionMessage: () => void;
  refetch: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // Guards against out-of-order responses: if the initial mount-time
  // fetchMe() (fired while still on /login, pre-auth) resolves AFTER a
  // later refetch() call (fired post-login, e.g. from Login.tsx), the
  // stale response would otherwise overwrite the correct, newer user
  // state and bounce an admin back to the non-admin dashboard. Only the
  // most recently *initiated* call is allowed to write to state.
  const fetchIdRef = useRef(0);

  async function fetchMe(): Promise<AuthUser | null> {
    const myId = ++fetchIdRef.current;
    try {
      const me = await apiFetch<AuthUser>('/api/auth/me');
      if (fetchIdRef.current !== myId) return me; // a newer call has since started — discard this result
      setUser(me);
      return me;
    } catch (err) {
      if (fetchIdRef.current !== myId) return null; // stale — don't clobber newer state
      setUser(null);
      // A guest with no session (NOT_AUTHENTICATED) is normal and silent.
      // A session that genuinely expired is worth telling the person about.
      if (err instanceof ApiError && err.code === 'SESSION_EXPIRED') {
        setSessionMessage('Your session has expired. Please sign in again.');
      }
      return null;
    } finally {
      if (fetchIdRef.current === myId) setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    // A logout should always win over any in-flight fetchMe(), so bump
    // the id here too — otherwise a slow-resolving earlier fetchMe()
    // could re-populate user after logout clears it.
    fetchIdRef.current++;
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionMessage,
        clearSessionMessage: () => setSessionMessage(null),
        refetch: fetchMe,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
