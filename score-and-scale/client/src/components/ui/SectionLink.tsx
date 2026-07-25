import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SectionLinkProps {
  to: string; // e.g. "#process"
  className?: string;
  children: ReactNode;
}

/**
 * On the Home page ("/"): renders a plain in-page anchor, so clicking
 * scrolls smoothly to the section without a route change.
 * On any other page: renders a router Link to "/#section" instead, so
 * React Router navigates Home first — ScrollToTop then picks up the hash
 * and scrolls to that section once mounted there.
 */
export function SectionLink({ to, className, children }: SectionLinkProps) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  if (isHome) {
    return (
      <a href={to} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={`/${to}`} className={className}>
      {children}
    </Link>
  );
}
