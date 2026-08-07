/**
 * Brand constants and navigation. Copy that appears in more than one place
 * lives here so the messaging stays identical everywhere, per the guide's
 * requirement that brand messaging remain consistent site-wide.
 */

import { ROUTES } from '@/router/routes';

export const BRAND = {
  name: 'Handcuffs 2 Cufflinks',
  shortName: 'H2C',
  tagline: 'From Struggle to Success',
  location: 'Boston, Massachusetts',
  creed: 'Faith. Family. Freedom.',
  legacyLine: 'Legacy in Motion',
  purposeLine: 'Built on purpose. Driven by legacy.',
  valueProposition:
    'Handcuffs 2 Cufflinks combines powerful storytelling, meaningful apparel, music, and media to inspire people worldwide to transform their struggles into success.',
} as const;

/** Approved supporting messages. Use these verbatim — do not paraphrase. */
export const SUPPORTING_MESSAGES = [
  'Your past is part of your story — not the end of it.',
  'Wear the transformation.',
  'Everybody has a Handcuffs 2 Cufflinks story.',
  'What once held you back can become what pushes you forward.',
] as const;

/** The North Star. Every page routes here. */
export const PRIMARY_CTA = {
  label: 'Join the Movement',
  to: ROUTES.join,
} as const;

export const SYMBOLISM = {
  handcuffs: {
    term: 'Handcuffs',
    meaning: 'Anything that once limited you.',
    items: [
      'Poverty',
      'Addiction',
      'Rejection',
      'Fear',
      'Homelessness',
      'Violence',
      'Lack of opportunity',
      'Bad decisions',
      'Personal struggles',
    ],
  },
  cufflinks: {
    term: 'Cufflinks',
    meaning: 'What you build once you are free.',
    items: [
      'Freedom',
      'Purpose',
      'Growth',
      'Ownership',
      'Discipline',
      'Leadership',
      'Success',
      'Personal transformation',
    ],
  },
} as const;

export type BrandKey = 'h2c' | 'gwop' | 'kitchen';

/**
 * The three brands are one ecosystem but must read as distinct. Each carries
 * its own accent colour token and its own attribution label.
 */
export const ECOSYSTEM: Record<
  BrandKey,
  {
    key: BrandKey;
    name: string;
    role: string;
    description: string;
    attribution: string;
    accentVar: string;
  }
> = {
  h2c: {
    key: 'h2c',
    name: 'Handcuffs 2 Cufflinks',
    role: 'The parent movement',
    description:
      'The movement itself — storytelling, apparel, community, and media that carry the message of transformation.',
    attribution: 'Handcuffs 2 Cufflinks',
    accentVar: 'var(--color-brand-h2c)',
  },
  gwop: {
    key: 'gwop',
    name: 'GWOP',
    role: 'Education and empowerment',
    description:
      'Programs that teach, mentor, and develop people — workshops, mentorship, and community initiatives.',
    attribution: 'Powered by GWOP',
    accentVar: 'var(--color-brand-gwop)',
  },
  kitchen: {
    key: 'kitchen',
    name: 'Kitchen Muzik Management',
    role: 'Music and artist development',
    description:
      'The label behind the soundtrack of the movement — artists, releases, and music videos.',
    attribution: 'Music by Kitchen Muzik Management',
    accentVar: 'var(--color-brand-kitchen)',
  },
};

export interface NavItem {
  label: string;
  to: string;
}

/** Navigation order is fixed by the guide, section 11. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', to: ROUTES.home },
  { label: 'The Movement', to: ROUTES.movement },
  { label: 'Collections', to: ROUTES.collections },
  { label: 'Docuseries', to: ROUTES.docuseries },
  { label: 'Podcast', to: ROUTES.podcast },
  { label: 'Music', to: ROUTES.music },
  { label: 'GWOP', to: ROUTES.gwop },
  { label: 'Community', to: ROUTES.community },
  { label: 'About the Founder', to: ROUTES.founder },
] as const;

export interface SocialLink {
  platform: string;
  url: string;
  handle: string;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { platform: 'YouTube', url: '#', handle: '@handcuffs2cufflinks' },
  { platform: 'Instagram', url: '#', handle: '@handcuffs2cufflinks' },
  { platform: 'Facebook', url: '#', handle: 'Handcuffs 2 Cufflinks' },
  { platform: 'TikTok', url: '#', handle: '@handcuffs2cufflinks' },
] as const;

/** Subscriber benefits — the guide requires meaningful benefits, not "newsletter". */
export const MOVEMENT_BENEFITS = [
  'Early apparel announcements',
  'New podcast episodes',
  'Docuseries releases',
  'Music drops from Kitchen Muzik',
  'Community news and events',
] as const;
