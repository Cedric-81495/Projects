import { NavLink, Outlet, Link } from 'react-router-dom'
import { Logo } from '../../components/marketing/Logo'
import { Button } from '../../components/ui/Button'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/enrollments', label: 'Enrollments', end: false },
  { to: '/admin/contacts', label: 'Contact inbox', end: false },
  { to: '/admin/documents', label: 'Documents', end: false },
  { to: '/admin/payments', label: 'Payments', end: false },
  { to: '/admin/audit-log', label: 'Audit log', end: false },
]

/**
 * Shell for the admin console.
 *
 * Deliberately plainer than the marketing site: this is a working tool, so
 * density and legibility beat visual flourish. The nav collapses to scrollable
 * tabs on narrow screens rather than hiding behind a menu, because an operator
 * on a phone still needs to switch views quickly.
 */
export function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div className="container-page">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" aria-label="Score and Scale — home">
                <Logo compact />
              </Link>
              <span className="rounded-pill border border-line bg-raised px-2.5 py-1 text-xs font-semibold text-muted">
                Admin
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden text-xs text-subtle sm:inline">{user?.email}</span>
              <ThemeToggle />
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                Log out
              </Button>
            </div>
          </div>

          <nav aria-label="Admin" className="-mx-1">
            <ul className="flex gap-1 overflow-x-auto pb-2">
              {NAV.map((item) => (
                <li key={item.to} className="shrink-0">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-ink text-canvas'
                          : 'text-muted hover:bg-raised hover:text-ink',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="container-page py-10">
        <Outlet />
      </main>
    </div>
  )
}
