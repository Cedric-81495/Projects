/**
 * Route map. Every path is declared once, here — nothing hard-codes a URL
 * string. Order matches the navigation required by the guide, section 11.
 */
export const ROUTES = {
  home: '/',
  movement: '/the-movement',
  collections: '/collections',
  collectionDetail: '/collections/:collectionSlug',
  apparelDetail: '/collections/item/:itemSlug',
  looks: '/collections/looks',
  docuseries: '/docuseries',
  docuseriesEpisode: '/docuseries/:episodeSlug',
  podcast: '/podcast',
  podcastEpisode: '/podcast/:episodeSlug',
  music: '/music',
  musicRelease: '/music/:releaseSlug',
  artist: '/music/artist/:artistSlug',
  gwop: '/gwop',
  community: '/community',
  submitStory: '/community/share-your-story',
  founder: '/about-the-founder',
  join: '/join-the-movement',
  legal: '/legal',
  legalDoc: '/legal/:docSlug',
  notFound: '*',

  /* Admin — CMS behind authentication and RBAC */
  signIn: '/admin/sign-in',
  admin: '/admin',
  adminDashboard: '/admin/dashboard',
  adminH2C: '/admin/handcuffs-2-cufflinks',
  adminKitchen: '/admin/kitchen-muzik',
  adminGwop: '/admin/gwop',
  adminCommunity: '/admin/community',
  adminMedia: '/admin/media',
  adminSubscribers: '/admin/subscribers',
  adminUsers: '/admin/users',
} as const;

/** Build a concrete path from a parameterised route. */
export function buildPath(
  pattern: string,
  params: Record<string, string | number>
): string {
  return pattern.replace(/:([A-Za-z]+)/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`buildPath: missing param "${key}" for pattern "${pattern}"`);
    }
    return encodeURIComponent(String(value));
  });
}
