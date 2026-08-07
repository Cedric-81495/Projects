import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/context/auth';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/router/routes';
import type { Permission } from '@/types/auth';

/**
 * CMS shell.
 *
 * Sections are grouped by the three brands rather than by content type, because
 * that is how the VAs are briefed — someone updating the label's releases should
 * not have to hunt through a generic "media" list. Nav entries a role cannot use
 * are hidden rather than shown disabled, so the panel matches the person's job.
 */
const NAV: { label: string; to: string; permission?: Permission }[] = [
  { label: 'Dashboard', to: ROUTES.adminDashboard, permission: 'analytics:read' },
  { label: 'Handcuffs 2 Cufflinks', to: ROUTES.adminH2C, permission: 'content:write' },
  { label: 'Kitchen Muzik', to: ROUTES.adminKitchen, permission: 'kmm:manage' },
  { label: 'GWOP', to: ROUTES.adminGwop, permission: 'gwop:manage' },
  { label: 'Community', to: ROUTES.adminCommunity, permission: 'community:moderate' },
  { label: 'Media library', to: ROUTES.adminMedia, permission: 'media:upload' },
  { label: 'Subscribers', to: ROUTES.adminSubscribers, permission: 'subscribers:read' },
  { label: 'Users', to: ROUTES.adminUsers, permission: 'users:manage' },
];

export function AdminLayout() {
  const { user, signOut, hasPermission } = useAuth();
  const visible = NAV.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr' }}>
      <aside
        style={{
          background: 'var(--pitch)',
          borderRight: '1px solid var(--rule)',
          padding: '26px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <Link to={ROUTES.home}>
          <img src="/media/logo-wordmark.webp" alt="Handcuffs 2 Cufflinks" style={{ width: '100%' }} />
        </Link>

        <nav aria-label="CMS sections" style={{ display: 'grid', gap: 2 }}>
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'tab is-on' : 'tab')}
              style={{ textAlign: 'left', display: 'block' }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
          {user && (
            <p className="micro" style={{ lineHeight: 1.6 }}>
              {user.fullName}
              <br />
              {user.role === 'super-admin' ? 'Super Administrator' : 'Admin'}
            </p>
          )}
          <Button variant="ghost" size="sm" wide onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </aside>

      <main style={{ padding: 'clamp(24px,3vw,44px)', background: 'var(--obsidian)' }}>
        <Outlet />
      </main>
    </div>
  );
}
