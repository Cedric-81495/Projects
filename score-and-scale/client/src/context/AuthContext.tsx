import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, apiFetch, setCsrfToken } from '../lib/api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  avatarUrl: string
}

interface AuthContextValue {
  user: AuthUser | null
  /** True until the initial /me call settles, so guards do not redirect early. */
  initialising: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refetch: () => Promise<AuthUser | null>
}

/**
 * Google sign-in has no method here on purpose.
 *
 * The authorization-code flow is a full-page redirect handled entirely by the
 * server, which sets the session cookies before returning the browser. By the
 * time this provider mounts again the session already exists, so the initial
 * /me call picks up both the user and the CSRF token with no client-side step.
 */

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthResponse {
  user: AuthUser
  csrfToken?: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initialising, setInitialising] = useState(true)

  /**
   * Monotonic request counter guarding against a stale response overwriting a
   * newer one.
   *
   * Two /me calls can be in flight at once — an initial mount plus a
   * post-login refetch, say — and network ordering is not guaranteed. Without
   * this the slower, older response can land last and clobber the correct user,
   * which shows up as an admin being demoted to a plain user seconds after
   * signing in. Every resolution checks it is still the newest before writing.
   */
  const fetchIdRef = useRef(0)

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    const fetchId = ++fetchIdRef.current

    try {
      const data = await apiFetch<AuthResponse>('/api/auth/me')
      if (fetchId !== fetchIdRef.current) return null

      setUser(data.user)
      return data.user
    } catch (error) {
      if (fetchId !== fetchIdRef.current) return null

      // A guest is an expected outcome here, not a failure worth surfacing.
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        setCsrfToken(null)
        return null
      }

      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    void fetchMe().finally(() => setInitialising(false))
  }, [fetchMe])

  /** Shared tail for every credential path. */
  const adopt = useCallback((data: AuthResponse): AuthUser => {
    // Invalidate any in-flight /me so it cannot overwrite this fresher user.
    fetchIdRef.current += 1
    if (data.csrfToken) setCsrfToken(data.csrfToken)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      return adopt(data)
    },
    [adopt],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      })
      return adopt(data)
    },
    [adopt],
  )

  const logout = useCallback(async () => {
    // Bumped first so a pending /me cannot restore the user after sign-out.
    fetchIdRef.current += 1

    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Even if the call fails the local session must be dropped.
    } finally {
      setUser(null)
      setCsrfToken(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, initialising, login, register, logout, refetch: fetchMe }),
    [user, initialising, login, register, logout, fetchMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
