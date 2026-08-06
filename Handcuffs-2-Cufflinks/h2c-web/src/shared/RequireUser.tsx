import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/AuthContext';

/** Gate member-only pages. Redirects to /signin, preserving where they came from. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="sec t-0">
        <div className="wrap">
          <p className="body">Loading…</p>
        </div>
      </section>
    );
  }
  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
