import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/context/auth';
import { ROUTES, buildPath } from '@/router/routes';
import type { Permission } from '@/types/auth';
import { Glyph } from './components/Glyph';
import type { GlyphName } from './components/Glyph';
import { Menu } from './components/Menu';
import { AdminChromeProvider } from './theme/AdminChromeProvider';
import { useAdminChrome } from './theme/theme';
import { RESOURCES, findResource } from './lib/resources';

/**
 * The CMS shell.
 *
 * Structure follows TailAdmin — fixed sidebar, sticky topbar, content column —
 * because that arrangement is what an operator already knows how to read.
 * Everything else follows the brand: near-black canvas, hairline borders, one
 * gold accent, no decorative colour.
 *
 * Navigation is grouped by brand rather than by content type, because that is
 * how the VAs are briefed. Someone updating the label's releases should not
 * have to hunt through a generic "media" list to find them.
 *
 * Entries a role cannot use are hidden rather than shown disabled. That is a
 * courtesy, not a security control — the API re-checks every permission, since
 * anything the browser decides can be bypassed.
 */

interface NavEntry {
  label: string;
  to: string;
  glyph: GlyphName;
  permission?: Permission;
  /** Also mark active for these path prefixes (a record list under a module). */
  owns?: string[];
}

interface NavGroup {
  name: string;
  entries: NavEntry[];
}

function recordPath(key: string): string {
  return buildPath(ROUTES.adminRecords, { resource: key });
}

const GROUPS: NavGroup[] = [
  {
    name: 'Overview',
    entries: [{ label: 'Dashboard', to: ROUTES.adminDashboard, glyph: 'grid', permission: 'analytics:read' }],
  },
  {
    name: 'Handcuffs 2 Cufflinks',
    entries: [
      {
        label: 'Movement content',
        to: ROUTES.adminH2C,
        glyph: 'sparkle',
        permission: 'content:write',
        owns: ['h2c', 'site'].flatMap((group) =>
          RESOURCES.filter((resource) => resource.group === group).map((resource) => recordPath(resource.key))
        ),
      },
      { label: 'Collections', to: recordPath('collections'), glyph: 'shirt', permission: 'content:write' },
      { label: 'Docuseries', to: recordPath('docuseries'), glyph: 'film', permission: 'content:write' },
      { label: 'Podcast', to: recordPath('podcast-episodes'), glyph: 'mic', permission: 'content:write' },
    ],
  },
  {
    name: 'Ecosystem',
    entries: [
      {
        label: 'Kitchen Muzik',
        to: ROUTES.adminKitchen,
        glyph: 'note',
        permission: 'kmm:manage',
        owns: RESOURCES.filter((resource) => resource.group === 'kitchen').map((resource) => recordPath(resource.key)),
      },
      {
        label: 'GWOP',
        to: ROUTES.adminGwop,
        glyph: 'graduation',
        permission: 'gwop:manage',
        owns: RESOURCES.filter((resource) => resource.group === 'gwop').map((resource) => recordPath(resource.key)),
      },
    ],
  },
  {
    name: 'Audience',
    entries: [
      { label: 'Community', to: ROUTES.adminCommunity, glyph: 'people', permission: 'community:moderate' },
      { label: 'Subscribers', to: ROUTES.adminSubscribers, glyph: 'mail', permission: 'subscribers:read' },
    ],
  },
  {
    name: 'The website',
    entries: [
      { label: 'Homepage', to: ROUTES.adminHomepage, glyph: 'layout', permission: 'content:write' },
      { label: 'Navigation', to: ROUTES.adminNavigation, glyph: 'compass', permission: 'settings:manage' },
      { label: 'Search metadata', to: ROUTES.adminSeo, glyph: 'search', permission: 'content:read' },
      { label: 'Media library', to: ROUTES.adminMedia, glyph: 'image', permission: 'media:upload' },
      { label: 'Founder', to: ROUTES.adminFounder, glyph: 'user', permission: 'content:write' },
      { label: 'Settings', to: ROUTES.adminSettings, glyph: 'settings', permission: 'content:read' },
    ],
  },
  {
    name: 'Access',
    entries: [{ label: 'Users and roles', to: ROUTES.adminUsers, glyph: 'shield', permission: 'users:manage' }],
  },
];

export function AdminLayout() {
  return (
    <AdminChromeProvider>
      <Chrome />
    </AdminChromeProvider>
  );
}

function Chrome() {
  const { theme, railTight, drawerOpen, setDrawerOpen } = useAdminChrome();
  const location = useLocation();

  // Navigating on a phone should put the drawer away; leaving it open covers
  // the page the operator just asked for.
  useEffect(() => setDrawerOpen(false), [location.pathname, setDrawerOpen]);

  return (
    <div className="adm" data-adm-theme={theme}>
      <div className="adm-shell" data-tight={railTight} data-drawer={drawerOpen}>
        <Rail />
        {drawerOpen && (
          <button
            type="button"
            className="adm-scrim"
            aria-label="Close the navigation"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <div className="adm-main">
          <Topbar />
          <div className="adm-page">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function Rail() {
  const { hasPermission } = useAuth();

  const groups = GROUPS.map((group) => ({
    ...group,
    entries: group.entries.filter((entry) => !entry.permission || hasPermission(entry.permission)),
  })).filter((group) => group.entries.length > 0);

  return (
    <aside className="adm-rail">
      <Link to={ROUTES.home} className="adm-brand">
        <span className="adm-brand-mark" aria-hidden="true">
          H2C
        </span>
        <span className="adm-brand-text">
          <b>Handcuffs 2 Cufflinks</b>
          <span>Content management</span>
        </span>
      </Link>

      {groups.map((group) => (
        <nav className="adm-railgroup" key={group.name} aria-label={group.name}>
          <h2>{group.name}</h2>
          {group.entries.map((entry) => (
            <RailLink key={entry.to} entry={entry} />
          ))}
        </nav>
      ))}

      <div className="adm-railfoot">
        <div className="adm-railtip adm-railfoot-text">
          <b>One movement</b>
          <p>Every record answers the same question: does this help someone see their story is still being written?</p>
        </div>
      </div>
    </aside>
  );
}

/** Every destination in the sidebar, used to resolve which single item lights up. */
const ALL_NAV_PATHS = GROUPS.flatMap((group) => group.entries.map((entry) => entry.to));

function RailLink({ entry }: { entry: NavEntry }) {
  const { pathname } = useLocation();

  /**
   * A module lights up for the record lists it owns — but only when nothing
   * more specific in the sidebar claims the same path.
   *
   * Collections appears both inside "Movement content" and as its own shortcut,
   * and without this both would highlight at once. Two active items is not a
   * richer answer to "where am I"; it is no answer.
   */
  const owned =
    (entry.owns?.some((path) => pathname.startsWith(path)) ?? false) &&
    !ALL_NAV_PATHS.some((path) => path !== entry.to && pathname.startsWith(path));

  return (
    <NavLink
      to={entry.to}
      end={entry.to === ROUTES.adminDashboard}
      className={({ isActive }) => (isActive || owned ? 'adm-navlink is-on' : 'adm-navlink')}
    >
      <Glyph name={entry.glyph} />
      <span>{entry.label}</span>
    </NavLink>
  );
}

function Topbar() {
  const { user, signOut } = useAuth();
  const { theme, toggle, railTight, toggleRail, setDrawerOpen } = useAdminChrome();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const initials = useMemo(() => {
    const parts = (user?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '—';
    return (parts[0][0] + (parts.at(-1)?.[0] ?? '')).toUpperCase();
  }, [user?.fullName]);

  return (
    <header className="adm-topbar">
      <button
        type="button"
        className="adm-iconbtn"
        onClick={() => {
          // One control, two behaviours: on desktop it collapses the rail to
          // icons; below the breakpoint the rail is a drawer, so it opens that.
          if (window.matchMedia('(width <= 1024px)').matches) setDrawerOpen(true);
          else toggleRail();
        }}
        aria-label={railTight ? 'Expand the navigation' : 'Collapse the navigation'}
      >
        <Glyph name="panel" />
      </button>

      <Breadcrumb />

      <form
        className="adm-search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const query = term.trim();
          if (!query) return;
          // Records are the only searchable surface, and collections is the
          // entry point most people mean. The list carries the term through.
          navigate(`${buildPath(ROUTES.adminRecords, { resource: 'collections' })}?q=${encodeURIComponent(query)}`);
        }}
      >
        <Glyph name="search" />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search records"
          aria-label="Search records"
        />
        <span className="adm-kbd">/</span>
      </form>

      <button
        type="button"
        className="adm-iconbtn"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
      >
        <Glyph name={theme === 'dark' ? 'sun' : 'moon'} />
      </button>

      <Menu
        label="Your account"
        trigger={({ toggle: openMenu, open, id }) => (
          <button
            type="button"
            className="adm-who"
            onClick={openMenu}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={open ? id : undefined}
          >
            <span className="adm-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="adm-who-text">
              <b>{user?.fullName ?? 'Signed in'}</b>
              <span>{user?.role === 'super-admin' ? 'Super Administrator' : 'Admin'}</span>
            </span>
            <Glyph name="chevron-down" size={14} />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="adm-menu-head">
              <b>{user?.fullName}</b>
              <span>{user?.email}</span>
            </div>
            <Link className="adm-menu-item" to={ROUTES.home} onClick={close}>
              <Glyph name="external" />
              View the public site
            </Link>
            <button
              type="button"
              className="adm-menu-item adm-menu-item--warn"
              onClick={() => {
                close();
                void signOut();
              }}
            >
              <Glyph name="logout" />
              Sign out
            </button>
          </>
        )}
      </Menu>
    </header>
  );
}

/**
 * Breadcrumb derived from the route rather than passed down.
 *
 * Every screen would otherwise have to declare its own trail, and the one that
 * forgets is the one an operator gets lost on.
 */
function Breadcrumb() {
  const { pathname } = useLocation();

  const trail = useMemo(() => {
    const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Dashboard', to: null as string | null }];

    if (segments[0] === 'records') {
      const resource = findResource(segments[1]);
      const list = { label: resource?.label ?? 'Records', to: resource ? recordPath(resource.key) : null };
      if (segments.length <= 2) return [{ ...list, to: null }];
      return [list, { label: segments[2] === 'new' ? `New ${resource?.singular ?? 'record'}` : 'Edit', to: null }];
    }

    const NAMES: Record<string, string> = {
      dashboard: 'Dashboard',
      'handcuffs-2-cufflinks': 'Movement content',
      'kitchen-muzik': 'Kitchen Muzik',
      gwop: 'GWOP',
      community: 'Community',
      media: 'Media library',
      subscribers: 'Subscribers',
      users: 'Users and roles',
      homepage: 'Homepage',
      navigation: 'Navigation',
      'search-metadata': 'Search metadata',
      founder: 'Founder',
      settings: 'Settings',
    };
    return [{ label: NAMES[segments[0]] ?? segments[0], to: null }];
  }, [pathname]);

  return (
    <nav className="adm-crumb" aria-label="Breadcrumb">
      <Link to={ROUTES.adminDashboard}>CMS</Link>
      {trail.map((step) => (
        <span key={step.label} className="adm-crumb" style={{ gap: 8 }}>
          <span className="adm-crumb-sep" aria-hidden="true">
            /
          </span>
          {step.to ? <Link to={step.to}>{step.label}</Link> : <b>{step.label}</b>}
        </span>
      ))}
    </nav>
  );
}
