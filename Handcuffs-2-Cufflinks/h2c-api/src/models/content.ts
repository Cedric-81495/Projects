import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform, publishableFields } from './plugins';

/**
 * Content models.
 *
 * Document types are inferred from the schemas with InferSchemaType rather than
 * hand-written alongside them. A duplicated interface silently drifts from the
 * schema it describes, and the compiler cannot tell you which one is right.
 *
 * Shapes mirror the frontend's domain types so responses drop straight into the
 * existing components with no mapping layer.
 *
 * Apparel deliberately carries no price, stock, or variant data yet. The fields
 * exist as optional on the frontend type for the eventual move to commerce, but
 * adding them to the schema now would invite a storefront the client has not
 * approved.
 */

const mediaAssetSchema = new Schema(
  {
    kind: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true },
    url: { type: String, required: true },
    // Required so no asset ships without it — accessibility is not optional.
    alt: { type: String, required: true, default: '' },
    caption: String,
    width: Number,
    height: Number,
    durationSeconds: Number,
    brand: { type: String, enum: ['h2c', 'gwop', 'kitchen'], default: 'h2c' },
  },
  { _id: false }
);

const slugField = { type: String, required: true, unique: true, lowercase: true, trim: true, index: true };

/* ------------------------------------------------------------------ */
/* Apparel                                                             */
/* ------------------------------------------------------------------ */

const collectionSchema = new Schema(
  {
    slug: slugField,
    name: { type: String, required: true, trim: true },
    premise: { type: String, default: '' },
    description: { type: String, default: '' },
    coverImage: mediaAssetSchema,
    displayOrder: { type: Number, default: 0, index: true },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(collectionSchema);
export type ApparelCollectionDoc = HydratedDocument<InferSchemaType<typeof collectionSchema>>;
export const ApparelCollection = model('Collection', collectionSchema);

const apparelItemSchema = new Schema(
  {
    slug: slugField,
    name: { type: String, required: true, trim: true },
    collectionId: { type: Schema.Types.ObjectId, ref: 'Collection', required: true, index: true },
    badge: { type: String, default: '' },
    /** Required by the guide: every piece carries its meaning. */
    story: { type: String, required: true },
    wearYourStoryMessage: { type: String, default: '' },
    images: { type: [mediaAssetSchema], default: [] },
    /** Filename the photographer must deliver, until real imagery lands. */
    assetSpec: String,
    fitNotes: { type: String, default: '' },
    sizes: { type: [{ size: String, chestInches: String, lengthInches: String, note: String }], default: [], _id: false },
    materials: { type: [String], default: [] },
    careInstructions: { type: [String], default: [] },
    shippingNotes: String,
    relatedItemIds: [{ type: Schema.Types.ObjectId, ref: 'ApparelItem' }],
    /**
     * Denormalised counters. The Engagement collection is the source of truth
     * and can rebuild these; they live here so listing a collection does not
     * need an aggregation per item.
     */
    engagement: {
      likes: { type: Number, default: 0, min: 0 },
      favorites: { type: Number, default: 0, min: 0 },
      votes: { type: Number, default: 0, min: 0 },
      notifyMeCount: { type: Number, default: 0, min: 0 },
      shares: { type: Number, default: 0, min: 0 },
      views: { type: Number, default: 0, min: 0 },
    },
    displayOrder: { type: Number, default: 0 },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(apparelItemSchema);
export type ApparelItemDoc = HydratedDocument<InferSchemaType<typeof apparelItemSchema>>;
export const ApparelItem = model('ApparelItem', apparelItemSchema);

const lookSchema = new Schema(
  {
    /** Two-digit string: order carries the narrative arc, so "01" sorts before "10". */
    lookNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    statement: { type: String, default: '' },
    heroImage: mediaAssetSchema,
    gallery: { type: [mediaAssetSchema], default: [] },
    pieces: { type: [String], default: [] },
    itemIds: [{ type: Schema.Types.ObjectId, ref: 'ApparelItem' }],
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(lookSchema);
export type LookDoc = HydratedDocument<InferSchemaType<typeof lookSchema>>;
export const Look = model('Look', lookSchema);

/* ------------------------------------------------------------------ */
/* Media content                                                       */
/* ------------------------------------------------------------------ */

const guestSchema = new Schema(
  {
    name: { type: String, required: true },
    biography: { type: String, default: '' },
    photo: mediaAssetSchema,
    role: String,
    links: { type: [{ label: String, url: String }], default: [], _id: false },
  },
  { _id: false }
);

const docuseriesSchema = new Schema(
  {
    slug: slugField,
    episodeNumber: { type: String, required: true },
    seasonNumber: { type: Number, default: 1, index: true },
    title: { type: String, required: true },
    teaser: { type: String, default: '' },
    heroImage: mediaAssetSchema,
    youtubeVideoId: { type: String, default: '' },
    guest: guestSchema,
    definingStruggle: { type: String, default: '' },
    transformationStory: { type: String, default: '' },
    /** The guide specifies exactly three. */
    keyLessons: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length === 0 || v.length === 3,
        message: 'An episode needs exactly three key lessons.',
      },
    },
    runtimeLabel: String,
    relatedApparelIds: [{ type: Schema.Types.ObjectId, ref: 'ApparelItem' }],
    isFeatured: { type: Boolean, default: false, index: true },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(docuseriesSchema);
export type DocuseriesEpisodeDoc = HydratedDocument<InferSchemaType<typeof docuseriesSchema>>;
export const DocuseriesEpisode = model('DocuseriesEpisode', docuseriesSchema);

const podcastSchema = new Schema(
  {
    slug: slugField,
    episodeNumber: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    coverImage: mediaAssetSchema,
    youtubeVideoId: { type: String, default: '' },
    guest: guestSchema,
    keyTakeaways: { type: [String], default: [] },
    durationSeconds: { type: Number, default: 0 },
    audioPlatformLinks: {
      type: [{ platform: String, label: String, url: String }],
      default: [],
      _id: false,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(podcastSchema);
export type PodcastEpisodeDoc = HydratedDocument<InferSchemaType<typeof podcastSchema>>;
export const PodcastEpisode = model('PodcastEpisode', podcastSchema);

const clipSchema = new Schema(
  {
    episodeId: { type: Schema.Types.ObjectId, ref: 'PodcastEpisode', default: null },
    quote: { type: String, required: true },
    attribution: { type: String, required: true },
    youtubeVideoId: String,
    startSeconds: Number,
    endSeconds: Number,
    /** Where a clip may appear, so the CMS controls reuse across the site. */
    placements: {
      type: [String],
      enum: ['home', 'podcast', 'movement', 'community'],
      default: ['podcast'],
    },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(clipSchema);
export type PodcastClipDoc = HydratedDocument<InferSchemaType<typeof clipSchema>>;
export const PodcastClip = model('PodcastClip', clipSchema);

/* ------------------------------------------------------------------ */
/* Kitchen Muzik Management                                            */
/* ------------------------------------------------------------------ */

const artistSchema = new Schema(
  {
    slug: slugField,
    name: { type: String, required: true },
    biography: { type: String, default: '' },
    city: String,
    activeSince: String,
    images: { type: [mediaAssetSchema], default: [] },
    socialLinks: { type: [{ platform: String, url: String }], default: [], _id: false },
    activeStatus: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(artistSchema);
export type ArtistDoc = HydratedDocument<InferSchemaType<typeof artistSchema>>;
export const Artist = model('Artist', artistSchema);

const releaseSchema = new Schema(
  {
    slug: slugField,
    title: { type: String, required: true },
    type: { type: String, enum: ['single', 'album', 'mixtape', 'music-video'], required: true, index: true },
    artistIds: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
    artistNames: { type: [String], default: [] },
    coverArt: mediaAssetSchema,
    genres: { type: [String], default: [] },
    releaseDate: { type: Date, default: null, index: true },
    note: { type: String, default: '' },
    lyrics: String,
    streamingLinks: { type: [{ platform: String, label: String, url: String }], default: [], _id: false },
    youtubeVideoId: String,
    credits: {
      producers: { type: [String], default: [] },
      songwriters: { type: [String], default: [] },
      collaborators: { type: [String], default: [] },
      recordingStudios: { type: [String], default: [] },
      copyrightNotice: String,
    },
    engagement: {
      plays: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: false, index: true },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(releaseSchema);
export type MusicReleaseDoc = HydratedDocument<InferSchemaType<typeof releaseSchema>>;
export const MusicRelease = model('MusicRelease', releaseSchema);

/* ------------------------------------------------------------------ */
/* GWOP                                                                */
/* ------------------------------------------------------------------ */

const programmeSchema = new Schema(
  {
    slug: slugField,
    kind: { type: String, enum: ['Course', 'Workshop', 'Seminar', 'Mentorship', 'Initiative'], required: true, index: true },
    name: { type: String, required: true },
    length: { type: String, default: '' },
    summary: { type: String, default: '' },
    description: String,
    outcomes: { type: [String], default: [] },
    eligibility: String,
    coverImage: mediaAssetSchema,
    capacity: Number,
    enrolledCount: { type: Number, default: 0 },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(programmeSchema);
export type GwopProgrammeDoc = HydratedDocument<InferSchemaType<typeof programmeSchema>>;
export const GwopProgramme = model('GwopProgramme', programmeSchema);

const eventSchema = new Schema(
  {
    slug: slugField,
    title: { type: String, required: true },
    startsAt: { type: Date, required: true, index: true },
    endsAt: Date,
    venue: { type: String, default: '' },
    address: String,
    speakers: { type: [String], default: [] },
    registrationUrl: String,
    capacity: Number,
    registeredCount: { type: Number, default: 0 },
    ...publishableFields,
  },
  { timestamps: true }
);
applyJsonTransform(eventSchema);
export type GwopEventDoc = HydratedDocument<InferSchemaType<typeof eventSchema>>;
export const GwopEvent = model('GwopEvent', eventSchema);
