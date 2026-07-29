import { useState, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.36 5.11A11.5 11.5 0 0 1 12 5c7 0 11 7 11 7a13.4 13.4 0 0 1-3.15 3.9M6.4 6.4A13.4 13.4 0 0 0 1 12s4 7 11 7a11.6 11.6 0 0 0 3.6-.57"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { refetch } = useAuth();

  // Only set when ProtectedRoute/AdminRoute redirected here from a
  // specific protected page. Not set when the person navigates to
  // /login directly (e.g. typing the URL, clicking a nav link).
  const from = (location.state as { from?: { pathname: string; search: string } })?.from
    ? `${(location.state as any).from.pathname}${(location.state as any).from.search}`
    : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // POST /api/auth/login sets the httpOnly cookies server-side.
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Confirm the session actually took before navigating — this is
      // what catches a cookie that silently failed to attach (e.g. a
      // sameSite/CORS misconfig) instead of dropping the person on the
      // dashboard only to get bounced straight back by ProtectedRoute.
      const me = await refetch();
      if (!me) {
        setError("We couldn't start your session. Please try signing in again.");
        return;
      }

      // Redirect-back takes priority (came from a specific protected
      // page). Otherwise send admins to the admin console and everyone
      // else to their dashboard.
      const destination = from ?? (me.role === 'admin' ? '/admin' : '/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setError('Incorrect email or password.');
      } else if (err instanceof ApiError && err.code === 'INVALID_INPUT') {
        setError('Please enter a valid email and password.');
      } else if (err instanceof ApiError && err.status === 429) {
        setError("Too many sign-in attempts. Please wait a minute and try again.");
      } else {
        setError("Couldn't sign in right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-8">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-6">
        <h1 className="font-display text-3xl text-offwhite mb-2">Sign in</h1>
        <div>
          <label htmlFor="email" className="block text-sm text-paper2 mb-2">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 text-offwhite focus:outline-none focus:border-brass"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-paper2 mb-2">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink2 border border-line rounded-sm px-4 py-3 pr-11 text-offwhite focus:outline-none focus:border-brass"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-paper2 hover:text-offwhite transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        {error && <p className="text-brandRed text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-sm text-sm font-semibold bg-brass text-ink hover:bg-brassBright disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="text-sm text-paper2 text-center">
          No account? <Link to="/register" className="text-brassBright hover:text-brass">Register</Link>
        </p>
        <p className="text-sm text-paper2 text-center">
          <Link to="/" className="text-brassBright hover:text-brass">Back to Home</Link>
        </p>
      </form>
    </div>
  );
}
