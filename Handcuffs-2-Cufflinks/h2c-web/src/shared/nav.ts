// Primary navigation, ordered by the site's emotional journey,
// grouped by functional hub (Inspire / Educate / Express / Participate).
export interface NavItem {
  label: string;
  to: string;
  meta?: string;
}

export const primaryNav: NavItem[] = [
  { label: 'Movement', to: '/movement', meta: 'The mission' },
  { label: 'Stories', to: '/stories', meta: 'Docuseries' },
  { label: 'Podcast', to: '/podcast', meta: 'Conversations' },
  { label: 'Music', to: '/music', meta: 'Kitchen Muzik' },
  { label: 'Lookbook', to: '/lookbook', meta: 'Wear your story' },
  { label: 'GWOP', to: '/gwop', meta: 'Ecosystem' },
  { label: 'Founder', to: '/about', meta: 'The story' },
  { label: 'Community', to: '/community', meta: 'Your journey' },
];

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'The Movement',
    items: [
      { label: 'What it means', to: '/movement' },
      { label: 'The founder', to: '/about' },
      { label: 'GWOP ecosystem', to: '/gwop' },
      { label: 'Join the movement', to: '/join' },
    ],
  },
  {
    heading: 'Experience',
    items: [
      { label: 'Docuseries', to: '/stories' },
      { label: 'Podcast', to: '/podcast' },
      { label: 'Music', to: '/music' },
      { label: 'Community', to: '/community' },
    ],
  },
  {
    heading: 'Brand Expression',
    items: [
      { label: 'The lookbook', to: '/lookbook' },
      { label: 'Wear your story', to: '/lookbook' },
      { label: 'Join the movement', to: '/join' },
    ],
  },
];
