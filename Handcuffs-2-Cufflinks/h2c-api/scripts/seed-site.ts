/**
 * Seeds the site chrome: settings, navigation, the homepage running order, the
 * founder placeholder, and the two legal pages the footer links to.
 *
 * Split from seed.ts because it seeds structure rather than content. Content is
 * the client's to replace; this is the scaffolding that has to exist for the
 * CMS to have anything to edit, and for a fresh database to serve a coherent
 * site rather than a page of empty sections.
 *
 * Idempotent in the same way as the content seed: everything is matched on its
 * natural key and updated. Copy is written with `$setOnInsert` where a VA is
 * likely to have edited it, so re-running after a schema change restores the
 * structure without overwriting their words.
 */
import {
  Announcement,
  FounderProfile,
  HomepageSection,
  NavigationMenu,
  SiteSettings,
  StaticPage,
} from '../src/models/site';

/** The thirteen blocks from the guide, in the order it specifies. */
const HOMEPAGE_SECTIONS = [
  { key: 'hero', heading: 'Handcuffs 2 Cufflinks', subheading: 'From Struggle to Success' },
  { key: 'trailer', eyebrow: 'The Movement', heading: 'Watch what transformation looks like' },
  { key: 'featured-apparel', eyebrow: 'Collections', heading: 'Wear the transformation', itemLimit: 6 },
  { key: 'meaning', eyebrow: 'The Meaning', heading: 'What the handcuffs were. What the cufflinks are.' },
  { key: 'looks', eyebrow: 'The Photoshoot', heading: 'Eight looks, eight chapters', itemLimit: 8 },
  { key: 'docuseries', eyebrow: 'Docuseries', heading: 'Everybody has a Handcuffs 2 Cufflinks story', itemLimit: 1 },
  { key: 'podcast', eyebrow: 'Podcast', heading: 'The conversations behind the change', itemLimit: 3 },
  { key: 'music', eyebrow: 'Kitchen Muzik Management', heading: 'The soundtrack of transformation', itemLimit: 3 },
  { key: 'gwop', eyebrow: 'GWOP', heading: 'Teaching, mentoring, building' },
  { key: 'community-stories', eyebrow: 'Community', heading: 'Your past is part of your story — not the end of it', itemLimit: 3 },
  { key: 'founder', eyebrow: 'The Founder', heading: 'Why this exists' },
  { key: 'join', eyebrow: 'Join the Movement', heading: 'Your story is still being written.' },
  { key: 'social', eyebrow: 'Follow', heading: 'Stay with the movement' },
] as const;

const HEADER_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'The Movement', href: '/movement' },
  { label: 'Collections', href: '/collections' },
  { label: 'Docuseries', href: '/docuseries' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Music', href: '/music' },
  { label: 'GWOP', href: '/gwop' },
  { label: 'Community', href: '/community' },
  { label: 'About the Founder', href: '/founder' },
  { label: 'Join the Movement', href: '/join', emphasis: 'primary' as const },
];

/**
 * The legal pages, marked isSystemPage so the API refuses to archive them.
 *
 * The cookie notice links to the privacy policy and the footer links to the
 * terms; archiving either would leave a live link pointing at a 404, which for
 * a page carrying consent language is a compliance problem rather than a
 * broken link.
 */
const LEGAL_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    summary: 'What we collect when you join the movement, and what we do with it.',
  },
  {
    slug: 'terms-of-use',
    title: 'Terms of Use',
    summary: 'The terms you agree to when you use this site or submit a story.',
  },
  {
    slug: 'cookie-notice',
    title: 'Cookie Notice',
    summary: 'The cookies this site sets, and why.',
  },
];

export async function seedSite(): Promise<void> {
  const settings = await SiteSettings.current();
  settings.set({
    missionStatement:
      settings.missionStatement ||
      'Handcuffs 2 Cufflinks combines storytelling, apparel, music, and media to inspire people worldwide to turn their struggles into success.',
    visionStatement:
      settings.visionStatement ||
      'A globally recognised movement where everybody who has been held back finds the proof that they can move forward.',
  });
  await settings.save();
  console.log('  ✓ site settings');

  await FounderProfile.current();
  console.log('  ✓ founder profile placeholder');

  for (const [index, section] of HOMEPAGE_SECTIONS.entries()) {
    await HomepageSection.findOneAndUpdate(
      { key: section.key },
      {
        // Order and enablement are structural, so they are reasserted every
        // run. The copy is only written on insert — a VA's rewrite of the
        // meaning block should survive a re-seed.
        $set: { displayOrder: index + 1, isEnabled: true },
        $setOnInsert: section,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`  ✓ ${HOMEPAGE_SECTIONS.length} homepage sections`);

  await NavigationMenu.findOneAndUpdate(
    { location: 'header' },
    {
      $set: {
        location: 'header',
        title: 'Main navigation',
        items: HEADER_ITEMS.map((item, index) => ({ ...item, displayOrder: index + 1 })),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await NavigationMenu.findOneAndUpdate(
    { location: 'legal' },
    {
      $set: {
        location: 'legal',
        title: 'Legal',
        items: LEGAL_PAGES.map((page, index) => ({
          label: page.title,
          href: `/${page.slug}`,
          displayOrder: index + 1,
        })),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('  ✓ header and legal navigation');

  for (const page of LEGAL_PAGES) {
    await StaticPage.findOneAndUpdate(
      { slug: page.slug },
      {
        $set: { isSystemPage: true },
        $setOnInsert: {
          ...page,
          // Left as a draft on purpose. These need real legal copy before they
          // go live, and publishing a placeholder privacy policy is worse than
          // having none — it makes a promise nobody wrote.
          status: 'draft',
          blocks: [
            {
              type: 'paragraph',
              text: 'This page has not been written yet. Replace this text in the CMS before publishing.',
            },
          ],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`  ✓ ${LEGAL_PAGES.length} legal pages (draft)`);

  // No announcement is seeded live — an unexplained banner on a fresh install
  // is confusing. The model is exercised so the collection and its indexes
  // exist.
  await Announcement.init();
}
