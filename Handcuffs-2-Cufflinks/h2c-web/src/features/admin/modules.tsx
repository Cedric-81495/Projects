import { ROUTES } from '@/router/routes';
import { ModuleIndexPage } from './ModuleIndexPage';

/**
 * The three brand modules, plus the website module that sits inside the parent
 * brand.
 *
 * Grouping follows the ecosystem architecture rather than data shape, because
 * that is how the VAs are briefed: someone updating the label's releases should
 * not have to hunt through a generic media list to find them.
 */

export function AdminH2CPage() {
  return (
    <ModuleIndexPage
      eyebrow="Handcuffs 2 Cufflinks"
      title="Movement content"
      intro="Everything on the public site: the homepage, the collections, the media, and the structure that holds them together."
      sections={[
        { name: 'Apparel and media', groups: ['h2c'] },
        {
          name: 'The website itself',
          groups: ['site'],
          links: [
            {
              to: ROUTES.adminHomepage,
              label: 'Homepage sections',
              blurb: 'The thirteen blocks the guide specifies, in the order visitors meet them.',
            },
            {
              to: ROUTES.adminNavigation,
              label: 'Navigation',
              blurb: 'Header, footer, drawer, and legal menus.',
            },
            {
              to: ROUTES.adminSeo,
              label: 'Search metadata',
              blurb: 'Per-route titles, descriptions, and share images.',
            },
            {
              to: ROUTES.adminFounder,
              label: 'Founder',
              blurb: 'The story, the message, and the speaking topics.',
            },
            {
              to: ROUTES.adminSettings,
              label: 'Site settings',
              blurb: 'Brand copy, contact addresses, socials, and maintenance mode.',
            },
          ],
        },
      ]}
    />
  );
}

export function AdminKitchenPage() {
  return (
    <ModuleIndexPage
      eyebrow="Kitchen Muzik Management"
      title="Label records"
      intro="The label's own roster, catalogue, and release schedule — part of the ecosystem, kept distinct from the parent brand."
      sections={[{ name: 'Roster and catalogue', groups: ['kitchen'] }]}
    />
  );
}

export function AdminGwopPage() {
  return (
    <ModuleIndexPage
      eyebrow="GWOP"
      title="Programme records"
      intro="Education, mentorship, and community development — the arm of the ecosystem that teaches rather than tells."
      sections={[{ name: 'Programmes and events', groups: ['gwop'] }]}
    />
  );
}
