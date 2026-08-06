import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { primaryNav } from '@/shared/nav';
import { useUI } from '@/shared/UIContext';
import { useAuth } from '@/shared/AuthContext';
import { cn } from '@/lib/cn';

export function Header() {
  const [stuck, setStuck] = useState(false);
  const { toggleOverlay } = useUI();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn('hdr', stuck && 'stuck')}>
      <Link to="/" className="mark" aria-label="Handcuffs 2 Cufflinks, home">
        Handcuffs<span>2</span>Cufflinks
      </Link>

      <nav className="nav" aria-label="Primary">
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => cn(isActive && 'active')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="hdr-tools">
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn--ghost btn--sm hdr-join">
                Admin
              </Link>
            )}
            <Link to="/profile" className="icon" aria-label="Your profile">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  width={26}
                  height={26}
                  style={{ borderRadius: '50%' }}
                />
              ) : (
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </Link>
          </>
        ) : (
          <Link to="/signin" className="btn btn--gold btn--sm hdr-join">
            Sign in
          </Link>
        )}
        <button className="icon" aria-label="Search" onClick={() => toggleOverlay('search')}>
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </button>
        <button
          className="icon burger"
          aria-label="Open menu"
          onClick={() => toggleOverlay('menu')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
