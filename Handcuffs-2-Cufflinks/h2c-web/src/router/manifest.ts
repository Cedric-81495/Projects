import { ROUTES } from './routes';

/**
 * Routes to prerender.
 *
 * `priority` and `changefreq` feed the sitemap. `dynamic: true` marks a route
 * whose slugs come from the CMS — those are appended at build time by
 * scripts/prerender.mjs once the API exposes them. Until then the static set is
 * prerendered and any unlisted URL falls through to the client-rendered app,
 * which still works for visitors.
 */
export interface RouteEntry {
  path: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  /** Excluded from the sitemap (utility pages). */
  unlisted?: boolean;
}

export const PRERENDER_ROUTES: RouteEntry[] = [
  { path: ROUTES.home, priority: 1.0, changefreq: 'weekly' },
  { path: ROUTES.movement, priority: 0.9, changefreq: 'monthly' },
  { path: ROUTES.collections, priority: 0.9, changefreq: 'weekly' },
  { path: ROUTES.looks, priority: 0.8, changefreq: 'monthly' },
  { path: ROUTES.docuseries, priority: 0.9, changefreq: 'weekly' },
  { path: ROUTES.podcast, priority: 0.9, changefreq: 'weekly' },
  { path: ROUTES.music, priority: 0.8, changefreq: 'weekly' },
  { path: ROUTES.gwop, priority: 0.8, changefreq: 'monthly' },
  { path: ROUTES.community, priority: 0.8, changefreq: 'weekly' },
  { path: ROUTES.submitStory, priority: 0.7, changefreq: 'monthly' },
  { path: ROUTES.founder, priority: 0.8, changefreq: 'monthly' },
  { path: ROUTES.join, priority: 0.9, changefreq: 'monthly' },
  { path: ROUTES.register, priority: 0.6, changefreq: 'monthly' },
  { path: ROUTES.signInMember, priority: 0.4, changefreq: 'yearly' },
  // ROUTES.account is deliberately absent: it is a private page, marked
  // noIndex, and there is nothing to prerender for a signed-out visitor.
  { path: ROUTES.legal, priority: 0.3, changefreq: 'yearly' },
  { path: `${ROUTES.legal}/privacy`, priority: 0.3, changefreq: 'yearly' },
  { path: `${ROUTES.legal}/terms`, priority: 0.3, changefreq: 'yearly' },
  { path: `${ROUTES.legal}/cookies`, priority: 0.3, changefreq: 'yearly' },
  { path: `${ROUTES.legal}/consent`, priority: 0.3, changefreq: 'yearly' },
];

/**
 * Routes that render only on the client, but still need a file on disk.
 *
 * The CMS and the member account page are never prerendered — there is nothing
 * to render for a signed-out visitor, and prerendering the admin shell would
 * put it in the build output for anyone to read. But "not prerendered" and "no
 * file at that path" are different things on a static host.
 *
 * Without a file, these paths depend entirely on the host's SPA fallback
 * rewrite. If that rewrite is missing, misconfigured, or the project's root
 * directory is set such that vercel.json is never read, the visitor gets the
 * platform's own 404 and the CMS is simply unreachable — with nothing in the
 * build log to suggest why.
 *
 * So each of these gets the same empty shell `app.html` carries: no markup to
 * hydrate against, noindex, and the client router takes over on load. The
 * rewrite stays as the safety net for parameterised detail routes, which
 * cannot be enumerated ahead of time.
 */
export const CLIENT_ONLY_ROUTES: string[] = [
  ROUTES.account,
  ROUTES.signIn,
  ROUTES.admin,
  ROUTES.adminDashboard,
  ROUTES.adminH2C,
  ROUTES.adminKitchen,
  ROUTES.adminGwop,
  ROUTES.adminCommunity,
  ROUTES.adminMedia,
  ROUTES.adminSubscribers,
  ROUTES.adminUsers,
];

/**
 * Detail routes awaiting the API. Each becomes
 * `${base}/${slug}` for every slug the endpoint returns.
 */
export const DYNAMIC_ROUTE_SOURCES = [
  { base: ROUTES.docuseries, endpoint: '/docuseries/episodes', priority: 0.8, changefreq: 'monthly' as const },
  { base: ROUTES.podcast, endpoint: '/podcast/episodes', priority: 0.8, changefreq: 'monthly' as const },
  { base: ROUTES.music, endpoint: '/kmm/releases', priority: 0.7, changefreq: 'monthly' as const },
  { base: ROUTES.community, endpoint: '/community/stories', priority: 0.7, changefreq: 'monthly' as const },
];
