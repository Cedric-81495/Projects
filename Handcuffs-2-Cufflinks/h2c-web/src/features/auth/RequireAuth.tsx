import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/context/auth';
import { ROUTES } from '@/router/routes';
import type { Permission } from '@/types/auth';

/**
 * Route guard.
 *
 * This is a usability control, not a security boundary — the API must enforce
 * the same permission on every request, because anything the browser checks can
 * be bypassed. Hiding a route here only stops an honest VA from wandering into
 * a screen they cannot use.
 */
export function RequireAuth({ permission }: { permission?: Permission }) {
  const { status, hasPermission } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="empty" style={{ paddingTop: 'calc(var(--top-h) + 80px)' }}>
        <p>Checking your session…</p>
      </div>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to={ROUTES.signIn} state={{ from: location.pathname }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="empty" style={{ paddingTop: 'calc(var(--top-h) + 80px)' }}>
        <h1 className="h-sm">You do not have access to this area</h1>
        <p>Ask a Super Administrator if you need it.</p>
      </div>
    );
  }

  return <Outlet />;
}
