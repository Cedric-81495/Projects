import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'

const LINKS = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/academy', label: 'Academy', end: false },
]

/**
 * Customer navigation.
 *
 * Horizontally scrollable tabs below the `sm` breakpoint and a fixed rail above
 * it, so the same component works at every width without a separate mobile menu.
 */
export function DashboardSidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="lg:w-56 lg:shrink-0">
      <div className="mb-6 hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">Signed in as</p>
        <p className="mt-1.5 truncate text-sm font-medium text-ink">{user?.name}</p>
        <p className="truncate text-xs text-subtle">{user?.email}</p>
      </div>

      <nav aria-label="Dashboard">
        <ul className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {LINKS.map((link) => (
            <li key={link.to} className="shrink-0 lg:shrink">
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-raised text-ink'
                      : 'text-muted hover:bg-raised/70 hover:text-ink',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 hidden lg:block">
        <Button variant="ghost" size="sm" fullWidth onClick={() => void logout()}>
          Log out
        </Button>
      </div>
    </aside>
  )
}
