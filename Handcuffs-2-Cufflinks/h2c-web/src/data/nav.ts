export type NavItem = { label: string; to: string; desc?: string };
export type NavGroup = { label: string; items: NavItem[] };

/** Grouped by functional hub, matching the platform architecture. */
export const navGroups: NavGroup[] = [
  {
    label: 'Experience',
    items: [
      { label: 'Stories', to: '/stories', desc: 'Documentaries of real transformation' },
      { label: 'Podcast', to: '/podcast', desc: 'Conversations that go deeper' },
      { label: 'Music', to: '/music', desc: 'Kitchen Muzik \u2014 the sound of it' },
    ],
  },
  {
    label: 'Understand',
    items: [
      { label: 'The Movement', to: '/movement', desc: 'The meaning of the symbol' },
      { label: 'Founder', to: '/founder', desc: 'The story behind it all' },
      { label: 'Ecosystem', to: '/ecosystem', desc: 'GWOP & Kitchen Muzik Management' },
    ],
  },
];

/** Flat primary links shown in the desktop bar. */
export const primaryLinks: NavItem[] = [
  { label: 'The Movement', to: '/movement' },
  { label: 'Stories', to: '/stories' },
  { label: 'Podcast', to: '/podcast' },
  { label: 'Music', to: '/music' },
  { label: 'Apparel', to: '/apparel' },
  { label: 'Community', to: '/community' },
];

// ⚠️ Replace these with the brand's real channel URLs before launch.
export const socials: NavItem[] = [
  { label: 'YouTube', to: 'https://youtube.com' },
  { label: 'Instagram', to: 'https://instagram.com' },
  { label: 'Spotify', to: 'https://spotify.com' },
  { label: 'TikTok', to: 'https://tiktok.com' },
];
