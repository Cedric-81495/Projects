import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface SectionLinkProps {
  /** Section id without the '#', e.g. "pricing". */
  section: string
  children: ReactNode
  className?: string
  onNavigate?: () => void
}

/**
 * Route-aware anchor for the marketing nav.
 *
 * On the home page a bare `#pricing` href lets the browser handle smooth
 * scrolling natively. Anywhere else that href would resolve against the current
 * route and do nothing, so it becomes a router Link carrying the hash — which
 * ScrollToTop then acts on after the navigation completes.
 */
export function SectionLink({ section, children, className, onNavigate }: SectionLinkProps) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  if (isHome) {
    return (
      <a href={`#${section}`} className={className} onClick={onNavigate}>
        {children}
      </a>
    )
  }

  return (
    <Link to={`/#${section}`} className={className} onClick={onNavigate}>
      {children}
    </Link>
  )
}
