import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { adminApi } from '@/services/admin';

/** Verifies an admin session before rendering nested admin routes. */
export function RequireAdmin() {
  const [state, setState] = useState<'checking' | 'ok' | 'no'>('checking');

  useEffect(() => {
    let alive = true;
    adminApi
      .me()
      .then(() => alive && setState('ok'))
      .catch(() => alive && setState('no'));
    return () => {
      alive = false;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-ink text-muted">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }
  if (state === 'no') return <Navigate to="/admin" replace />;
  return <Outlet />;
}
