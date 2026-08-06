import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminMe, adminLogout } from '@/services/auth';

type Gate = 'checking' | 'in' | 'out';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/moderation', label: 'Moderation', end: false },
];

export function AdminLayout() {
  const [gate, setGate] = useState<Gate>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    adminMe()
      .then(() => alive && setGate('in'))
      .catch(() => alive && setGate('out'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (gate === 'out') navigate('/admin/login', { replace: true });
  }, [gate, navigate]);

  if (gate !== 'in') {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <p className="body">{gate === 'checking' ? 'Checking access…' : 'Redirecting…'}</p>
      </div>
    );
  }

  const signOut = async () => {
    await adminLogout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '16px var(--gut)',
          borderBottom: '1px solid var(--rule)',
          background: 'var(--ink)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexWrap: 'wrap',
        }}
      >
        <span className="mark" style={{ fontSize: '1rem' }}>
          H2C<span>·</span>Admin
        </span>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `filter-chip${isActive ? ' is-on' : ''}`}
              style={({ isActive }) =>
                isActive ? { borderColor: 'var(--brass)', color: 'var(--brass)' } : undefined
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <a href="/" className="link" style={{ marginLeft: 'auto' }}>
          View site
        </a>
        <button className="btn btn--ghost btn--sm" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <main style={{ padding: 'clamp(24px,4vw,48px) var(--gut)' }}>
        <Outlet />
      </main>
    </div>
  );
}
