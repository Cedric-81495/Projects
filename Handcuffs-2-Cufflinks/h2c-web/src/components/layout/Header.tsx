import { useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Announcement } from './Announcement';
import { MobileNav } from './MobileNav';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/ui/Wordmark';
import { useStickyHeader } from '@/hooks/useStickyHeader';
import { useEngagement } from '@/providers/context/engagement';
import { useMember } from '@/providers/context/member';
import { NAV_ITEMS, BRAND, PRIMARY_CTA } from '@/config/site';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

/**
 * Fixed header. Transparent over the hero, then frosted obsidian once scrolled
 * so the wordmark stays legible against photography.
 *
 * Below 1280px the nav collapses to a full-screen drawer — ten items is more
 * than a phone can show, and truncating them would bury the ecosystem brands.
 */
export function Header() {
  const stackRef = useRef<HTMLDivElement>(null);
  const isStuck = useStickyHeader(stackRef);
  const [menuOpen, setMenuOpen] = useState(false);
  const { savedCount, openDrawer } = useEngagement();
  const { member } = useMember();
  const location = useLocation();

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <div className="topstack" ref={stackRef}>
        <Announcement />
        <header className={cn('hdr', isStuck && 'is-stuck')} id="hdr">
          <Link to="/" className="hdr-logo" aria-label={`${BRAND.name} — home`}>
            <Wordmark size="sm" />
          </Link>

          <nav className="nav" aria-label="Main">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'is-on' : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to={PRIMARY_CTA.to}
              className={({ isActive }) => cn('nav-join', isActive && 'is-on')}
            >
              {PRIMARY_CTA.label}
            </NavLink>
            {/* Secondary to Join the Movement, which stays the North Star. */}
            <NavLink
              to={member ? ROUTES.account : ROUTES.signInMember}
              className={({ isActive }) => (isActive ? 'is-on' : undefined)}
            >
              {member ? member.firstName : 'Sign in'}
            </NavLink>
          </nav>

          <div className="hdr-tools">
            <button
              type="button"
              className="iconbtn"
              onClick={openDrawer}
              aria-label={`Saved pieces${savedCount ? ` (${savedCount})` : ''}`}
            >
              <Icon name="save" />
              {savedCount > 0 && <span className="pip">{savedCount}</span>}
            </button>
            <button
              type="button"
              className="iconbtn burger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mnav"
            >
              <Icon name="menu" />
            </button>
          </div>
        </header>
      </div>

      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        currentPath={location.pathname}
      />
    </>
  );
}
