import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  async function fetchMe(): Promise<AuthUser | null> {
    try {
      const me = await apiFetch<AuthUser>('/api/auth/me');
      setUser(me);
      return me;
    } catch (err) {
      setUser(null);
      // A guest with no session (NOT_AUTHENTICATED) is normal and silent.
      // A session that genuinely expired is worth telling the person about.
      if (err instanceof ApiError && err.code === 'SESSION_EXPIRED') {
        setSessionMessage('Your session has expired. Please sign in again.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  async function logout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
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
