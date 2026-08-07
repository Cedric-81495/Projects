/**
 * Endpoint registry. The reference build annotated each content block with the
 * API call that will eventually feed it; those annotations are formalised here
 * so swapping seed data for live data is a one-line change per feature.
 */
export const API = {
  auth: {
    signIn: '/auth/sign-in',
    signOut: '/auth/sign-out',
    refresh: '/auth/refresh',
    google: '/auth/google',
    me: '/auth/me',
    requestReset: '/auth/password/request-reset',
    resetPassword: '/auth/password/reset',
    verifyEmail: '/auth/verify-email',
  },

  collections: {
    list: '/collections',
    detail: (slug: string) => `/collections/${slug}`,
  },

  apparel: {
    list: '/apparel',
    detail: (slug: string) => `/apparel/${slug}`,
    /** Engagement replaces the cart in showcase mode. */
    engage: (id: string, action: string) => `/apparel/${id}/${action}`,
    voteTotals: '/apparel/vote-totals',
  },

  looks: {
    list: '/looks',
    detail: (n: number | string) => `/looks/${n}`,
  },

  docuseries: {
    episodes: '/docuseries/episodes',
    episode: (slug: string) => `/docuseries/episodes/${slug}`,
    featured: '/docuseries/episodes/featured',
  },

  podcast: {
    episodes: '/podcast/episodes',
    episode: (slug: string) => `/podcast/episodes/${slug}`,
    featured: '/podcast/episodes/featured',
    clips: '/podcast/clips',
    nominateGuest: '/podcast/guest-nominations',
  },

  kmm: {
    releases: '/kmm/releases',
    release: (slug: string) => `/kmm/releases/${slug}`,
    artists: '/kmm/artists',
    artist: (slug: string) => `/kmm/artists/${slug}`,
  },

  gwop: {
    programmes: '/gwop/programmes',
    programme: (slug: string) => `/gwop/programmes/${slug}`,
    events: '/gwop/events',
    enroll: (slug: string) => `/gwop/programmes/${slug}/enroll`,
  },

  community: {
    stories: '/community/stories',
    story: (slug: string) => `/community/stories/${slug}`,
    submitStory: '/community/stories',
    volunteer: '/community/volunteer',
    mentorship: '/community/mentorship-applications',
  },

  movement: {
    /** The North Star conversion. */
    subscribe: '/subscribers',
    unsubscribe: (token: string) => `/subscribers/unsubscribe/${token}`,
  },

  cms: {
    pages: '/cms/pages',
    hero: '/cms/hero',
    navigation: '/cms/navigation',
    seo: '/cms/seo',
    media: '/cms/media',
    announcements: '/cms/announcements',
    auditLog: '/cms/audit-log',
  },

  analytics: {
    dashboard: '/analytics/dashboard',
    apparelEngagement: '/analytics/apparel-engagement',
    trackView: '/analytics/view',
  },

  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    role: (id: string) => `/users/${id}/role`,
  },
} as const;
