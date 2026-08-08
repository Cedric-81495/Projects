import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType, Model } from 'mongoose';
import { applyJsonTransform, publishableFields } from './plugins';

/**
 * Site chrome and structure.
 *
 * Everything a visitor sees that is not a story, a piece, an episode, or a
 * track: the announcement bar, the hero art, the order of the homepage, the
 * navigation, the standing pages, the founder's message, and the metadata
 * search engines read.
 *
 * These exist as records rather than as constants in the frontend for one
 * reason from the guide: a VA has to be able to change the homepage without a
 * developer and without a deploy. Anything hard-coded is something the client
 * has to file a ticket for.
 *
 * Two shapes recur and are worth naming up front:
 *
 *   Singletons (SiteSettings, FounderProfile) — exactly one document, fetched
 *   through `.current()`, which creates the defaults on first read so a fresh
 *   database serves a coherent site instead of 404s.
 *
 *   Ordered collections (HeroBanner, HomepageSection, NavigationMenu items) —
 *   carry `displayOrder`, because the sequence is editorial. The homepage order
 *   in the guide is a narrative arc, not a list.
 */

/**
 * Reads a singleton document, creating it from schema defaults on first call.
 *
 * upsert rather than find-then-create, and a retry on top: two concurrent
 * upserts against the same unique key do not serialise, so MongoDB raises a
 * duplicate-key error for the loser rather than merging them. On a cold, empty
 * database the very first page load fans out into several of these at once, so
 * the race is the common case, not the rare one — and an unhandled 409 on first
 * load is a poor introduction to the CMS.
 */
async function readSingleton<T>(
  model: { findOneAndUpdate(filter: object, update: object, options: object): Promise<T> },
  key: string
): Promise<T> {
  const run = () =>
    model.findOneAndUpdate(
      { singleton: key },
      { $setOnInsert: { singleton: key } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

  try {
    return await run();
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    return run();
  }
}

/* ------------------------------------------------------------------ */
/* Shared sub-schemas                                                  */
/* ------------------------------------------------------------------ */

/**
 * SEO metadata.
 *
 * Every field is optional and every field has a documented fallback, because
 * the failure mode of required SEO fields is that a VA cannot publish. The
 * resolver in the site module fills the blanks from the record's own title and
 * summary, so an untouched page still shares correctly.
 */
const seoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 70 },
    description: { type: String, trim: true, maxlength: 200 },
    keywords: { type: [String], default: [] },
    /** Absolute URL. Social cards do not resolve relative paths. */
    ogImageUrl: { type: String, trim: true },
    ogImageAlt: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },
    /**
     * Set on a page that must not be indexed — a thank-you page, a campaign
     * landing page, an archived drop. Never defaulted true: a site that
     * accidentally ships noindex disappears from search silently.
     */
    noIndex: { type: Boolean, default: false },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    /** Required, defaulted empty rather than optional — the field must exist so
     *  its emptiness is visible in the CMS instead of merely unset. */
    alt: { type: String, required: true, default: '' },
    width: Number,
    height: Number,
    focalPoint: {
      type: new Schema(
        { x: { type: Number, min: 0, max: 100, default: 50 }, y: { type: Number, min: 0, max: 100, default: 50 } },
        { _id: false }
      ),
      default: () => ({ x: 50, y: 50 }),
    },
  },
  { _id: false }
);

const ctaSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    variant: { type: String, enum: ['gold', 'ghost', 'text'], default: 'gold' },
    /** Marks the one CTA on a section that is the Join the Movement action, so
     *  the frontend can style and the dashboard can attribute conversions. */
    isPrimaryAction: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ------------------------------------------------------------------ */
/* Site settings — singleton                                           */
/* ------------------------------------------------------------------ */

const siteSettingsSchema = new Schema(
  {
    /**
     * Fixed discriminator. A unique index on a constant is the cheapest way to
     * make "there is exactly one of these" a database guarantee rather than a
     * convention someone eventually breaks with a stray create().
     */
    singleton: { type: String, default: 'site', enum: ['site'], unique: true },

    brandName: { type: String, default: 'Handcuffs 2 Cufflinks' },
    tagline: { type: String, default: 'From Struggle to Success' },
    creed: { type: String, default: 'Faith. Family. Freedom.' },
    legacyLine: { type: String, default: 'Legacy in Motion' },
    location: { type: String, default: 'Boston, Massachusetts' },

    /** Shown wherever the movement is explained in one paragraph. */
    missionStatement: { type: String, default: '' },
    visionStatement: { type: String, default: '' },

    socialLinks: {
      type: [
        new Schema(
          {
            platform: {
              type: String,
              enum: ['youtube', 'instagram', 'facebook', 'tiktok', 'x', 'linkedin', 'spotify', 'apple-music', 'other'],
              required: true,
            },
            label: String,
            url: { type: String, required: true },
            displayOrder: { type: Number, default: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    contact: {
      generalEmail: String,
      pressEmail: String,
      /** Speaking engagement enquiries — a named KPI in the guide. */
      bookingEmail: String,
      phone: String,
      mailingAddress: String,
    },

    /** Default social card and title template for routes with no override. */
    defaultSeo: { type: seoSchema, default: () => ({}) },

    /** Whether the Join the Movement form accepts a mobile number. */
    smsSignupEnabled: { type: Boolean, default: true },

    /**
     * Global kill switch for the storefront. The guide is explicit that
     * Collections showcases rather than sells until the client approves
     * commerce, so the flag lives in the database where turning it on is a
     * recorded, audited decision.
     */
    commerceEnabled: { type: Boolean, default: false },

    /** Serves a holding page to visitors while leaving the CMS reachable. */
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: '' },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

applyJsonTransform(siteSettingsSchema);

export type SiteSettingsDoc = HydratedDocument<InferSchemaType<typeof siteSettingsSchema>>;

interface SiteSettingsModel extends Model<InferSchemaType<typeof siteSettingsSchema>> {
  current(): Promise<SiteSettingsDoc>;
}

siteSettingsSchema.statics.current = async function current(): Promise<SiteSettingsDoc> {
  return readSingleton<SiteSettingsDoc>(this, 'site');
};

export const SiteSettings = model<InferSchemaType<typeof siteSettingsSchema>, SiteSettingsModel>(
  'SiteSettings',
  siteSettingsSchema
);

/* ------------------------------------------------------------------ */
/* Founder profile — singleton                                         */
/* ------------------------------------------------------------------ */

const founderProfileSchema = new Schema(
  {
    singleton: { type: String, default: 'founder', enum: ['founder'], unique: true },

    name: { type: String, default: '' },
    role: { type: String, default: 'Founder' },
    portrait: { type: imageSchema, default: undefined },

    /** The short version, used in the homepage founder block. */
    message: { type: String, default: '' },
    /** The long version, used on About the Founder. */
    story: { type: String, default: '' },
    lessonsLearned: { type: [String], default: [] },
    /**
     * Why the movement exists, in the founder's words. Held separately from
     * the site-wide mission statement: one is the brand's, one is his, and
     * flattening them into a single field loses the personal voice the guide
     * asks for.
     */
    whyThisExists: { type: String, default: '' },
    gwopConnection: { type: String, default: '' },
    kitchenMuzikConnection: { type: String, default: '' },
    globalVision: { type: String, default: '' },

    speakingTopics: { type: [String], default: [] },
    /** Shown alongside the booking email on the founder page. */
    speakingBlurb: { type: String, default: '' },

    gallery: { type: [imageSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

applyJsonTransform(founderProfileSchema);

export type FounderProfileDoc = HydratedDocument<InferSchemaType<typeof founderProfileSchema>>;

interface FounderProfileModel extends Model<InferSchemaType<typeof founderProfileSchema>> {
  current(): Promise<FounderProfileDoc>;
}

founderProfileSchema.statics.current = async function current(): Promise<FounderProfileDoc> {
  return readSingleton<FounderProfileDoc>(this, 'founder');
};

export const FounderProfile = model<InferSchemaType<typeof founderProfileSchema>, FounderProfileModel>(
  'FounderProfile',
  founderProfileSchema
);

/* ------------------------------------------------------------------ */
/* Announcement bar                                                    */
/* ------------------------------------------------------------------ */

/**
 * The strip above the header.
 *
 * Time-bounded rather than a single "active" boolean: announcements are almost
 * always tied to a drop, an episode, or an event, and a VA scheduling one for
 * Friday should not have to remember to come back and switch it off. Both
 * bounds are optional, so an open-ended notice is still expressible.
 */
const announcementSchema = new Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 160 },
    linkLabel: { type: String, trim: true },
    linkHref: { type: String, trim: true },
    tone: { type: String, enum: ['emerald', 'gold', 'pitch'], default: 'emerald' },
    startsAt: { type: Date, default: null, index: true },
    endsAt: { type: Date, default: null, index: true },
    /** Higher wins when more than one announcement is live at the same moment. */
    priority: { type: Number, default: 0 },
    /** Whether the visitor may close it for the session. */
    dismissible: { type: Boolean, default: true },
    ...publishableFields,
  },
  { timestamps: true }
);

applyJsonTransform(announcementSchema);
export type AnnouncementDoc = HydratedDocument<InferSchemaType<typeof announcementSchema>>;
export const Announcement = model('Announcement', announcementSchema);

/* ------------------------------------------------------------------ */
/* Hero banners                                                        */
/* ------------------------------------------------------------------ */

const heroBannerSchema = new Schema(
  {
    /**
     * Which surface the banner belongs to. One collection rather than a model
     * per page: the shape is identical, and splitting it would mean the CMS
     * grew a new screen every time a page wanted a banner.
     */
    placement: {
      type: String,
      enum: ['home', 'movement', 'collections', 'docuseries', 'podcast', 'music', 'gwop', 'community', 'founder', 'join'],
      required: true,
      index: true,
    },
    eyebrow: { type: String, trim: true },
    heading: { type: String, required: true, trim: true },
    supportingMessage: { type: String, trim: true },
    image: { type: imageSchema, default: undefined },
    /** Cinematic trailer behind the still, where the design calls for one. */
    videoUrl: { type: String, trim: true },
    youtubeVideoId: { type: String, trim: true },
    ctas: { type: [ctaSchema], default: [] },
    /**
     * Overlay strength, 0–100. Exposed because legibility depends on the
     * photograph, and the alternative is a developer nudging a gradient every
     * time the art changes.
     */
    scrimStrength: { type: Number, min: 0, max: 100, default: 55 },
    displayOrder: { type: Number, default: 0, index: true },
    ...publishableFields,
  },
  { timestamps: true }
);

applyJsonTransform(heroBannerSchema);
export type HeroBannerDoc = HydratedDocument<InferSchemaType<typeof heroBannerSchema>>;
export const HeroBanner = model('HeroBanner', heroBannerSchema);

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */

/**
 * The thirteen homepage blocks from the guide, as records.
 *
 * `key` is a closed enum, not free text. The frontend renders a specific
 * component per key, so an arbitrary value would produce a section that
 * silently renders nothing — and the guide fixes both the set and its order.
 * What the CMS controls is the copy, whether a block is shown, and the
 * sequence; not the invention of new block types, which is a code change.
 */
export const HOMEPAGE_SECTION_KEYS = [
  'hero',
  'trailer',
  'featured-apparel',
  'meaning',
  'looks',
  'docuseries',
  'podcast',
  'music',
  'gwop',
  'community-stories',
  'founder',
  'join',
  'social',
] as const;

const homepageSectionSchema = new Schema(
  {
    key: { type: String, enum: HOMEPAGE_SECTION_KEYS, required: true, unique: true },
    eyebrow: { type: String, trim: true },
    heading: { type: String, trim: true },
    subheading: { type: String, trim: true },
    body: { type: String, trim: true },
    ctas: { type: [ctaSchema], default: [] },
    /**
     * How many records to pull for the feed-backed sections. Ignored by static
     * blocks, so it is one field rather than a per-key settings union.
     */
    itemLimit: { type: Number, min: 1, max: 24, default: 3 },
    /** Pinned records, in order, ahead of whatever the feed returns. */
    featuredIds: { type: [String], default: [] },
    backgroundImage: { type: imageSchema, default: undefined },
    /**
     * Hiding a section is not the same as deleting it. Toggling this keeps the
     * copy so it can come back later, which is how a seasonal block behaves.
     */
    isEnabled: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

applyJsonTransform(homepageSectionSchema);
export type HomepageSectionDoc = HydratedDocument<InferSchemaType<typeof homepageSectionSchema>>;
export const HomepageSection = model('HomepageSection', homepageSectionSchema);

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Menu items, one level of nesting.
 *
 * Children are embedded rather than referenced. A navigation menu is read as a
 * whole on every page load and edited as a whole in the CMS, so a tree of
 * documents would mean N queries and N writes to reorder a menu — and the guide
 * asks for navigation that stays clean, which two levels already satisfies.
 */
const navChildSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isExternal: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
);

const navItemSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, trim: true },
    /** Renders as the standout action rather than a plain link. */
    emphasis: { type: String, enum: ['none', 'primary', 'muted'], default: 'none' },
    isExternal: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    children: { type: [navChildSchema], default: [] },
  },
  { _id: false }
);

const navigationMenuSchema = new Schema(
  {
    location: {
      type: String,
      enum: ['header', 'footer-primary', 'footer-secondary', 'mobile-drawer', 'legal'],
      required: true,
      unique: true,
    },
    title: { type: String, trim: true },
    items: { type: [navItemSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

applyJsonTransform(navigationMenuSchema);
export type NavigationMenuDoc = HydratedDocument<InferSchemaType<typeof navigationMenuSchema>>;
export const NavigationMenu = model('NavigationMenu', navigationMenuSchema);

/* ------------------------------------------------------------------ */
/* Static pages                                                        */
/* ------------------------------------------------------------------ */

/**
 * Editable standing pages: privacy policy, terms, cookie notice, and whatever
 * the movement adds later.
 *
 * The body is a list of typed blocks rather than a single HTML string. Storing
 * raw HTML authored in the CMS and rendering it in the site is the shortest
 * path to stored XSS; typed blocks mean the frontend decides the markup and the
 * database only ever holds text.
 */
const pageBlockSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['paragraph', 'heading', 'list', 'quote', 'image', 'video', 'cta', 'divider'],
      required: true,
    },
    text: { type: String, default: '' },
    /** Heading level, 2–4. h1 belongs to the page title. */
    level: { type: Number, min: 2, max: 4, default: 2 },
    items: { type: [String], default: [] },
    attribution: { type: String, trim: true },
    image: { type: imageSchema, default: undefined },
    youtubeVideoId: { type: String, trim: true },
    cta: { type: ctaSchema, default: undefined },
  },
  { _id: false }
);

const staticPageSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    blocks: { type: [pageBlockSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
    /**
     * Marks a page the site depends on structurally — the privacy policy the
     * cookie notice links to, for example. Archiving one is refused in the
     * route, so a tidy-up cannot break a legally required link.
     */
    isSystemPage: { type: Boolean, default: false },
    ...publishableFields,
  },
  { timestamps: true }
);

applyJsonTransform(staticPageSchema);
export type StaticPageDoc = HydratedDocument<InferSchemaType<typeof staticPageSchema>>;
export const StaticPage = model('StaticPage', staticPageSchema);

/* ------------------------------------------------------------------ */
/* Route SEO overrides                                                 */
/* ------------------------------------------------------------------ */

/**
 * Metadata for routes that are not records — the Collections index, the
 * Docuseries index, the homepage itself.
 *
 * Record-backed routes carry their own `seo`; these have nowhere else to live,
 * and without them the whole site would share one description in search
 * results.
 */
const routeSeoSchema = new Schema(
  {
    /** Path with a leading slash, e.g. "/collections". Normalised in the route. */
    path: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    seo: { type: seoSchema, default: () => ({}) },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

applyJsonTransform(routeSeoSchema);
export type RouteSeoDoc = HydratedDocument<InferSchemaType<typeof routeSeoSchema>>;
export const RouteSeo = model('RouteSeo', routeSeoSchema);
