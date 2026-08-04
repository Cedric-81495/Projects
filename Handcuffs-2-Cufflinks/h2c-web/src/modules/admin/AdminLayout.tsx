import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/brand/Logo';
import { adminApi } from '@/services/admin';
import { cn } from '@/lib/cn';

const links = [
  { to: '/admin/dashboard', label: 'Moderation' },
  { to: '/admin/content/stories', label: 'Stories' },
  { to: '/admin/content/episodes', label: 'Episodes' },
  { to: '/admin/content/tracks', label: 'Tracks' },
];

export function AdminLayout() {
  const navigate = useNavigate();

  async function logout() {
    await adminApi.logout().catch(() => {});
    navigate('/admin', { replace: true });
  }

  return (
    <div className="min-h-full bg-ink">
      <header className="sticky top-0 z-40 border-b border-faint/30 bg-ink/90 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-eyebrow text-gold sm:inline">
              Admin
            </span>
          </div>
          <nav aria-label="Admin" className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm transition-colors',
                    isActive ? 'bg-gold/10 text-gold' : 'text-muted hover:text-bone',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-faint/50 px-4 py-2 text-sm text-bone transition hover:border-gold"
          >
            <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </Container>
        {/* Mobile nav */}
        <Container className="flex gap-1 overflow-x-auto pb-3 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-gold/10 text-gold' : 'text-muted',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </Container>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
