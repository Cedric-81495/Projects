import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { ButtonLink } from '../ui/Button'
import { SectionLink } from '../ui/SectionLink'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo } from './Logo'

const NAV = [
  { section: 'how-it-works', label: 'How it works' },
  { section: 'programs', label: 'Programs' },
  { section: 'results', label: 'Results' },
  { section: 'faq', label: 'FAQ' },
] as const

export function Header() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // rAF-throttled: the handler only sets a boolean, so it must not run more
    // often than the screen can show the change.
    let frame = 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12)
        frame = 0
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Close the mobile menu on navigation, otherwise it stays open over the new page.
  useEffect(() => setMenuOpen(false), [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const dashboardHref = user?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-b border-line bg-canvas/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-6 sm:h-18">
          <Link to="/" className="shrink-0" aria-label="Score and Scale — home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <SectionLink
                key={item.section}
                section={item.section}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
              >
                {item.label}
              </SectionLink>
            ))}
            <Link
              to="/contact"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:grid" />

            {user ? (
              <ButtonLink to={dashboardHref} variant="primary" size="sm" className="hidden sm:inline-flex">
                {user.role === 'admin' ? 'Admin' : 'Dashboard'}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign in
                </ButtonLink>
                <ButtonLink to="/register" variant="primary" size="sm" className="hidden sm:inline-flex">
                  Get started
                </ButtonLink>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-ink lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3.5 7h17M3.5 12h17M3.5 17h17"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="animate-fade-in border-t border-line bg-canvas lg:hidden"
        >
          <nav className="container-page flex flex-col py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <SectionLink
                key={item.section}
                section={item.section}
                onNavigate={() => setMenuOpen(false)}
                className="border-b border-line py-3.5 text-[0.9375rem] font-medium text-ink"
              >
                {item.label}
              </SectionLink>
            ))}
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
              className="border-b border-line py-3.5 text-[0.9375rem] font-medium text-ink"
            >
              Contact
            </Link>

            <div className="mt-5 flex flex-col gap-3">
              {user ? (
                <ButtonLink to={dashboardHref} variant="primary" size="md" fullWidth>
                  {user.role === 'admin' ? 'Go to admin' : 'Go to dashboard'}
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/register" variant="primary" size="md" fullWidth>
                    Get started
                  </ButtonLink>
                  <ButtonLink to="/login" variant="secondary" size="md" fullWidth>
                    Sign in
                  </ButtonLink>
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted">Appearance</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
