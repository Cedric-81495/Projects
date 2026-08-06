import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { primaryNav } from '@/shared/nav';
import { useUI } from '@/shared/UIContext';
import { useAuth } from '@/shared/AuthContext';
import { lookbook, stories, podcastEpisodes } from '@/data';
import { plain } from '@/lib/text';
import { cn } from '@/lib/cn';

// Shared veil + Escape handling for any open overlay.
export function Veil() {
  const { overlay, closeOverlay } = useUI();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeOverlay();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOverlay]);
  useEffect(() => {
    document.body.style.overflow = overlay ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [overlay]);
  return <div className={cn('veil', overlay && 'on')} onClick={closeOverlay} aria-hidden="true" />;
}

export function MobileNav() {
  const { overlay, closeOverlay } = useUI();
  const { user, logout } = useAuth();
  const open = overlay === 'menu';
  return (
    <nav className={cn('mnav', open && 'open')} aria-label="Mobile" aria-hidden={!open}>
      <button className="icon mnav-close" aria-label="Close menu" onClick={closeOverlay}>
        <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      {primaryNav.map((item) => (
        <Link key={item.to} to={item.to} onClick={closeOverlay}>
          {item.label}
          {item.meta && <span>{item.meta}</span>}
        </Link>
      ))}
      <Link to="/join" onClick={closeOverlay}>
        Join<span>The movement</span>
      </Link>
      {user ? (
        <>
          <Link to="/profile" onClick={closeOverlay}>
            Profile<span>Your account</span>
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" onClick={closeOverlay}>
              Admin<span>Dashboard</span>
            </Link>
          )}
          <Link
            to="/"
            onClick={() => {
              closeOverlay();
              void logout();
            }}
          >
            Sign out<span>{user.email}</span>
          </Link>
        </>
      ) : (
        <Link to="/signin" onClick={closeOverlay}>
          Sign in<span>Members</span>
        </Link>
      )}
    </nav>
  );
}

interface Hit { kind: string; label: string; to: string; }

export function SearchOverlay() {
  const { overlay, closeOverlay } = useUI();
  const open = overlay === 'search';
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const index = useMemo<Hit[]>(
    () => [
      ...stories.map((e) => ({ kind: `Story · ${e.cat}`, label: plain(e.title), to: '/stories' })),
      ...podcastEpisodes.map((e) => ({ kind: 'Podcast', label: plain(e.title), to: '/podcast' })),
      ...lookbook.map((l) => ({ kind: 'Collections', label: l.name, to: '/lookbook' })),
    ],
    []
  );

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return index.filter((h) => h.label.toLowerCase().includes(term)).slice(0, 8);
  }, [q, index]);

  useEffect(() => { if (!open) setQ(''); }, [open]);

  return (
    <div className={cn('searchbox', open && 'open')} role="dialog" aria-modal="true" aria-label="Search" aria-hidden={!open}>
      <div className="searchbox-row">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Search stories, podcast, looks"
          autoComplete="off"
          aria-label="Search everything"
        />
        <button className="icon" aria-label="Close search" onClick={closeOverlay}>
          <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      {q && (
        <div className="sres">
          {results.length === 0 && <p className="count">No results for “{q}”.</p>}
          {results.map((h) => (
            <a key={h.to + h.label} href={h.to} onClick={(e) => { e.preventDefault(); closeOverlay(); nav(h.to); }}>
              <span>{h.label}</span>
              <span className="kind">{h.kind}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const COOKIE_KEY = 'h2ccookiechoice';

export function CookieBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const chosen = document.documentElement.dataset[COOKIE_KEY];
    if (!chosen) setShow(true);
  }, []);
  const choose = () => {
    document.documentElement.dataset[COOKIE_KEY] = 'yes';
    setShow(false);
  };
  return (
    <div className={cn('cookie', show && 'on')} role="region" aria-label="Cookie notice">
      <p>We use a few cookies to keep the site working and to understand what people watch and read. Nothing sold, nothing creepy.</p>
      <div className="btn-row">
        <button className="btn btn--gold btn--sm" onClick={choose}>Accept all</button>
        <button className="btn btn--ghost btn--sm" onClick={choose}>Essential only</button>
      </div>
    </div>
  );
}

export function BackToTop() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const onScroll = () => setOn(window.scrollY > 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button className={cn('totop', on && 'on')} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    </button>
  );
}

export function Toast() {
  const { toast } = useUI();
  return <div className={cn('toast', toast && 'show')} role="status">{toast}</div>;
}
