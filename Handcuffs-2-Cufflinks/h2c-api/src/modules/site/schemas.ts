import { z } from 'zod';
import { HOMEPAGE_SECTION_KEYS } from '@/models/site';

/**
 * Validators for the site chrome.
 *
 * Every update schema is `.partial()` on top of a shared object, so PATCH means
 * "change these fields" rather than "replace the document". The distinction
 * matters here more than elsewhere: a CMS form that posts back only the tab it
 * edited must not wipe the tabs it did not.
 */

const trimmed = (max: number) => z.string().trim().max(max);

/** Rejects anything that is not a relative path or an http(s) URL. */
const href = z
  .string()
  .trim()
  .min(1, 'Enter a link.')
  .max(500)
  .refine(
    (value) => value.startsWith('/') || value.startsWith('#') || /^https?:\/\//i.test(value),
    // javascript: and data: URLs in a CMS-controlled link are stored XSS the
    // moment the frontend puts them in an href.
    'Links must be a path starting with "/" or a full http(s) address.'
  );

export const seoSchema = z
  .object({
    title: trimmed(70).optional(),
    description: trimmed(200).optional(),
    keywords: z.array(trimmed(60)).max(20).optional(),
    ogImageUrl: z.string().url().optional().or(z.literal('')),
    ogImageAlt: trimmed(160).optional(),
    canonicalUrl: z.string().url().optional().or(z.literal('')),
    noIndex: z.boolean().optional(),
  })
  .strict();

const imageSchema = z
  .object({
    url: z.string().trim().min(1).max(1000),
    alt: trimmed(200).default(''),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    focalPoint: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .optional(),
  })
  .strict();

const ctaSchema = z
  .object({
    label: trimmed(60).min(1),
    href,
    variant: z.enum(['gold', 'ghost', 'text']).default('gold'),
    isPrimaryAction: z.boolean().default(false),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const settingsUpdate = z
  .object({
    brandName: trimmed(120),
    tagline: trimmed(160),
    creed: trimmed(160),
    legacyLine: trimmed(160),
    location: trimmed(160),
    missionStatement: trimmed(2000),
    visionStatement: trimmed(2000),
    socialLinks: z
      .array(
        z
          .object({
            platform: z.enum([
              'youtube',
              'instagram',
              'facebook',
              'tiktok',
              'x',
              'linkedin',
              'spotify',
              'apple-music',
              'other',
            ]),
            label: trimmed(60).optional(),
            url: z.string().url('Enter the full address, including https://'),
            displayOrder: z.number().int().default(0),
          })
          .strict()
      )
      .max(20),
    contact: z
      .object({
        generalEmail: z.string().email().optional().or(z.literal('')),
        pressEmail: z.string().email().optional().or(z.literal('')),
        bookingEmail: z.string().email().optional().or(z.literal('')),
        phone: trimmed(40).optional(),
        mailingAddress: trimmed(400).optional(),
      })
      .strict(),
    defaultSeo: seoSchema,
    smsSignupEnabled: z.boolean(),
    commerceEnabled: z.boolean(),
    maintenanceMode: z.boolean(),
    maintenanceMessage: trimmed(400),
  })
  .partial()
  .strict();

/* ------------------------------------------------------------------ */
/* Founder                                                             */
/* ------------------------------------------------------------------ */

export const founderUpdate = z
  .object({
    name: trimmed(120),
    role: trimmed(80),
    portrait: imageSchema,
    message: trimmed(3000),
    story: trimmed(20000),
    lessonsLearned: z.array(trimmed(400)).max(12),
    whyThisExists: trimmed(4000),
    gwopConnection: trimmed(4000),
    kitchenMuzikConnection: trimmed(4000),
    globalVision: trimmed(4000),
    speakingTopics: z.array(trimmed(160)).max(20),
    speakingBlurb: trimmed(2000),
    gallery: z.array(imageSchema).max(24),
    seo: seoSchema,
  })
  .partial()
  .strict();

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

const announcementBase = z.object({
  message: trimmed(160).min(1, 'Write the announcement.'),
  linkLabel: trimmed(60).optional(),
  linkHref: href.optional(),
  tone: z.enum(['emerald', 'gold', 'pitch']).default('emerald'),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  priority: z.number().int().min(0).max(100).default(0),
  dismissible: z.boolean().default(true),
});

/**
 * A window that closes before it opens would silently never show. Caught here
 * rather than in the UI so the API is the thing that guarantees it.
 */
const orderedWindow = <T extends { startsAt?: Date | null; endsAt?: Date | null }>(value: T, ctx: z.RefinementCtx) => {
  if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endsAt'],
      message: 'The end time has to be after the start time.',
    });
  }
};

export const announcementCreate = announcementBase.strict().superRefine(orderedWindow);
export const announcementUpdate = announcementBase.partial().strict().superRefine(orderedWindow);

/* ------------------------------------------------------------------ */
/* Hero banners                                                        */
/* ------------------------------------------------------------------ */

const heroBase = z.object({
  placement: z.enum([
    'home',
    'movement',
    'collections',
    'docuseries',
    'podcast',
    'music',
    'gwop',
    'community',
    'founder',
    'join',
  ]),
  eyebrow: trimmed(80).optional(),
  heading: trimmed(200).min(1, 'Give the banner a heading.'),
  supportingMessage: trimmed(400).optional(),
  image: imageSchema.optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  youtubeVideoId: trimmed(20).optional(),
  ctas: z.array(ctaSchema).max(3).default([]),
  scrimStrength: z.number().int().min(0).max(100).default(55),
  displayOrder: z.number().int().default(0),
});

export const heroCreate = heroBase.strict();
export const heroUpdate = heroBase.partial().strict();

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */

const homepageSectionBase = z.object({
  key: z.enum(HOMEPAGE_SECTION_KEYS),
  eyebrow: trimmed(80).optional(),
  heading: trimmed(200).optional(),
  subheading: trimmed(300).optional(),
  body: trimmed(4000).optional(),
  ctas: z.array(ctaSchema).max(3).default([]),
  itemLimit: z.number().int().min(1).max(24).default(3),
  featuredIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Not a valid record id.')).max(24).default([]),
  backgroundImage: imageSchema.optional(),
  isEnabled: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const homepageSectionCreate = homepageSectionBase.strict();
/** `key` is omitted: changing it would turn one section into another. */
export const homepageSectionUpdate = homepageSectionBase.omit({ key: true }).partial().strict();

export const reorderSchema = z
  .object({
    order: z
      .array(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), displayOrder: z.number().int() }).strict())
      .min(1, 'Send at least one section.')
      .max(50),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

const navChild = z
  .object({
    label: trimmed(60).min(1),
    href,
    description: trimmed(160).optional(),
    isExternal: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
    isVisible: z.boolean().default(true),
  })
  .strict();

const navItem = z
  .object({
    label: trimmed(60).min(1),
    href: href.optional(),
    emphasis: z.enum(['none', 'primary', 'muted']).default('none'),
    isExternal: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
    isVisible: z.boolean().default(true),
    children: z.array(navChild).max(12).default([]),
  })
  .strict()
  .refine(
    (item) => Boolean(item.href) || item.children.length > 0,
    // A top-level item with neither a destination nor children is a dead link.
    { message: 'A menu item needs either a link or child items.', path: ['href'] }
  );

export const navigationUpsert = z
  .object({
    title: trimmed(80).optional(),
    items: z.array(navItem).max(24),
  })
  .strict();

export const navigationLocation = z.enum([
  'header',
  'footer-primary',
  'footer-secondary',
  'mobile-drawer',
  'legal',
]);

/* ------------------------------------------------------------------ */
/* Static pages                                                        */
/* ------------------------------------------------------------------ */

const pageBlock = z
  .object({
    type: z.enum(['paragraph', 'heading', 'list', 'quote', 'image', 'video', 'cta', 'divider']),
    text: trimmed(8000).default(''),
    level: z.number().int().min(2).max(4).default(2),
    items: z.array(trimmed(600)).max(60).default([]),
    attribution: trimmed(160).optional(),
    image: imageSchema.optional(),
    youtubeVideoId: trimmed(20).optional(),
    cta: ctaSchema.optional(),
  })
  .strict();

const pageBase = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.')
    .max(80),
  title: trimmed(200).min(1, 'Give the page a title.'),
  summary: trimmed(400).default(''),
  blocks: z.array(pageBlock).max(200).default([]),
  seo: seoSchema.optional(),
});

export const pageCreate = pageBase.strict();
export const pageUpdate = pageBase.partial().strict();

/* ------------------------------------------------------------------ */
/* Route SEO                                                           */
/* ------------------------------------------------------------------ */

export const routeSeoUpsert = z
  .object({
    path: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^\/[a-z0-9\-/]*$/, 'Paths start with "/" and contain lowercase words and hyphens.')
      .max(200),
    seo: seoSchema,
  })
  .strict();
