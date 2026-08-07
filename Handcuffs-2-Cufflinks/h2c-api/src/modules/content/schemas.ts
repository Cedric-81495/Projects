import { z } from 'zod';

/**
 * Content validation.
 *
 * Create schemas require the fields a record cannot be meaningful without;
 * update schemas make everything optional so the CMS can save one field at a
 * time. Unknown keys are stripped by default, which is what stops a crafted
 * payload from setting `status` or `engagement` directly.
 */

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.');

const mediaAsset = z.object({
  kind: z.enum(['image', 'video', 'audio', 'document']),
  url: z.string().url(),
  alt: z.string().max(300).default(''),
  caption: z.string().max(500).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().nonnegative().optional(),
  brand: z.enum(['h2c', 'gwop', 'kitchen']).default('h2c'),
});

const link = z.object({ platform: z.string().max(60), label: z.string().max(80).optional(), url: z.string().url() });

export const collectionCreate = z.object({
  slug,
  name: z.string().trim().min(1).max(160),
  premise: z.string().max(400).default(''),
  description: z.string().max(4000).default(''),
  coverImage: mediaAsset.optional(),
  displayOrder: z.number().int().default(0),
});
export const collectionUpdate = collectionCreate.partial();

export const apparelCreate = z.object({
  slug,
  name: z.string().trim().min(1).max(160),
  collectionId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a collection.'),
  badge: z.string().max(60).default(''),
  story: z.string().min(1, 'Every piece needs its meaning.').max(2000),
  wearYourStoryMessage: z.string().max(400).default(''),
  images: z.array(mediaAsset).default([]),
  assetSpec: z.string().max(200).optional(),
  fitNotes: z.string().max(1000).default(''),
  sizes: z.array(z.object({
    size: z.string().max(20),
    chestInches: z.string().max(20).optional(),
    lengthInches: z.string().max(20).optional(),
    note: z.string().max(200).optional(),
  })).default([]),
  materials: z.array(z.string().max(120)).default([]),
  careInstructions: z.array(z.string().max(200)).default([]),
  relatedItemIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  displayOrder: z.number().int().default(0),
});
export const apparelUpdate = apparelCreate.partial();

export const lookCreate = z.object({
  lookNumber: z.string().regex(/^\d{2}$/, 'Use a two-digit number such as 01.'),
  title: z.string().trim().min(1).max(160),
  statement: z.string().max(1000).default(''),
  heroImage: mediaAsset.optional(),
  gallery: z.array(mediaAsset).default([]),
  pieces: z.array(z.string().max(160)).default([]),
  itemIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
});
export const lookUpdate = lookCreate.partial();

const guest = z.object({
  name: z.string().max(160),
  biography: z.string().max(3000).default(''),
  photo: mediaAsset.optional(),
  role: z.string().max(160).optional(),
  links: z.array(z.object({ label: z.string().max(80), url: z.string().url() })).default([]),
});

export const docuseriesCreate = z.object({
  slug,
  episodeNumber: z.string().max(10),
  seasonNumber: z.number().int().min(1).default(1),
  title: z.string().trim().min(1).max(200),
  teaser: z.string().max(600).default(''),
  heroImage: mediaAsset.optional(),
  youtubeVideoId: z.string().max(40).default(''),
  guest: guest.optional(),
  definingStruggle: z.string().max(3000).default(''),
  transformationStory: z.string().max(6000).default(''),
  keyLessons: z.array(z.string().max(300)).length(3, 'Give exactly three lessons.').or(z.array(z.string()).length(0)),
  runtimeLabel: z.string().max(30).optional(),
  relatedApparelIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  isFeatured: z.boolean().default(false),
});
export const docuseriesUpdate = docuseriesCreate.partial();

export const podcastCreate = z.object({
  slug,
  episodeNumber: z.string().max(10),
  title: z.string().trim().min(1).max(200),
  summary: z.string().max(2000).default(''),
  coverImage: mediaAsset.optional(),
  youtubeVideoId: z.string().max(40).default(''),
  guest: guest.optional(),
  keyTakeaways: z.array(z.string().max(300)).default([]),
  durationSeconds: z.number().int().nonnegative().default(0),
  audioPlatformLinks: z.array(link).default([]),
  isFeatured: z.boolean().default(false),
});
export const podcastUpdate = podcastCreate.partial();

export const clipCreate = z.object({
  episodeId: z.string().regex(/^[a-f\d]{24}$/i).nullable().default(null),
  quote: z.string().min(1).max(500),
  attribution: z.string().min(1).max(160),
  youtubeVideoId: z.string().max(40).optional(),
  startSeconds: z.number().nonnegative().optional(),
  endSeconds: z.number().nonnegative().optional(),
  placements: z.array(z.enum(['home', 'podcast', 'movement', 'community'])).default(['podcast']),
});
export const clipUpdate = clipCreate.partial();

export const artistCreate = z.object({
  slug,
  name: z.string().trim().min(1).max(160),
  biography: z.string().max(6000).default(''),
  city: z.string().max(120).optional(),
  activeSince: z.string().max(20).optional(),
  images: z.array(mediaAsset).default([]),
  socialLinks: z.array(z.object({ platform: z.string().max(60), url: z.string().url() })).default([]),
  activeStatus: z.enum(['active', 'inactive']).default('active'),
});
export const artistUpdate = artistCreate.partial();

export const releaseCreate = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  type: z.enum(['single', 'album', 'mixtape', 'music-video']),
  artistIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  artistNames: z.array(z.string().max(160)).default([]),
  coverArt: mediaAsset.optional(),
  genres: z.array(z.string().max(60)).default([]),
  releaseDate: z.coerce.date().nullable().default(null),
  note: z.string().max(1000).default(''),
  lyrics: z.string().max(20000).optional(),
  streamingLinks: z.array(link).default([]),
  youtubeVideoId: z.string().max(40).optional(),
  credits: z.object({
    producers: z.array(z.string().max(160)).default([]),
    songwriters: z.array(z.string().max(160)).default([]),
    collaborators: z.array(z.string().max(160)).default([]),
    recordingStudios: z.array(z.string().max(160)).default([]),
    copyrightNotice: z.string().max(400).optional(),
  }).default({ producers: [], songwriters: [], collaborators: [], recordingStudios: [] }),
  isFeatured: z.boolean().default(false),
});
export const releaseUpdate = releaseCreate.partial();

export const programmeCreate = z.object({
  slug,
  kind: z.enum(['Course', 'Workshop', 'Seminar', 'Mentorship', 'Initiative']),
  name: z.string().trim().min(1).max(200),
  length: z.string().max(60).default(''),
  summary: z.string().max(1000).default(''),
  description: z.string().max(8000).optional(),
  outcomes: z.array(z.string().max(300)).default([]),
  eligibility: z.string().max(1000).optional(),
  coverImage: mediaAsset.optional(),
  capacity: z.number().int().positive().optional(),
});
export const programmeUpdate = programmeCreate.partial();

export const eventCreate = z.object({
  slug,
  title: z.string().trim().min(1).max(200),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  venue: z.string().max(200).default(''),
  address: z.string().max(400).optional(),
  speakers: z.array(z.string().max(160)).default([]),
  registrationUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
});
export const eventUpdate = eventCreate.partial();
