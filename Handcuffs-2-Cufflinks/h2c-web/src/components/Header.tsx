import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { primaryNav } from '@/shared/nav';
import { useUI } from '@/shared/UIContext';
import { cn } from '@/lib/cn';

export function Header() {
  const [stuck, setStuck] = useState(false);
  const { toggleOverlay } = useUI();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn('hdr', stuck && 'stuck')}>
      <Link to="/" className="mark" aria-label="Handcuffs 2 Cufflinks, home">
        H<span>2</span>C
      </Link>

      <nav className="nav" aria-label="Primary">
        {primaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(isActive && 'active')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="hdr-tools">
        <Link to="/join" className="btn btn--gold btn--sm hdr-join">Join</Link>
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
