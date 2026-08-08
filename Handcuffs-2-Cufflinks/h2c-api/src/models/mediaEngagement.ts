import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform } from './plugins';

/**
 * Engagement with media: music, docuseries, podcast.
 *
 * Apparel engagement is a separate collection and stays that way. There the
 * signal is intent — a like decides what gets manufactured, so one visitor
 * counts once, ever. Here the signal is consumption: someone playing a track
 * three weeks running is three real listens, and collapsing that to one would
 * make "music plays" useless as the KPI the guide names.
 *
 * The compromise is a day bucket. One row per (visitor, target, action, day),
 * with `occurrences` counting repeats inside that day. So a listener who leaves
 * a track on loop for an afternoon registers one play-day and an honest
 * occurrence count, while a script hammering the endpoint cannot manufacture a
 * thousand distinct listeners.
 */

export const MEDIA_TARGET_TYPES = [
  'music-release',
  'docuseries-episode',
  'podcast-episode',
  'podcast-clip',
] as const;
export type MediaTargetType = (typeof MEDIA_TARGET_TYPES)[number];

/** Which Mongoose model each target type resolves to. */
export const MEDIA_TARGET_MODELS: Record<MediaTargetType, string> = {
  'music-release': 'MusicRelease',
  'docuseries-episode': 'DocuseriesEpisode',
  'podcast-episode': 'PodcastEpisode',
  'podcast-clip': 'PodcastClip',
};

export const MEDIA_ACTIONS = ['view', 'play', 'complete', 'download', 'share'] as const;
export type MediaAction = (typeof MEDIA_ACTIONS)[number];

/**
 * Which actions each target type accepts.
 *
 * A download on a docuseries episode or a completion on a still-frame clip is
 * not a thing that can happen, and accepting it would put figures on the
 * dashboard that no real interaction produced.
 */
export const ALLOWED_ACTIONS: Record<MediaTargetType, readonly MediaAction[]> = {
  'music-release': ['view', 'play', 'complete', 'download', 'share'],
  'docuseries-episode': ['view', 'play', 'complete', 'share'],
  'podcast-episode': ['view', 'play', 'complete', 'share'],
  'podcast-clip': ['view', 'play', 'share'],
};

const mediaEngagementSchema = new Schema(
  {
    visitorId: { type: String, required: true, index: true },
    targetType: { type: String, enum: MEDIA_TARGET_TYPES, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, enum: MEDIA_ACTIONS, required: true },

    /**
     * UTC date, "YYYY-MM-DD". A string rather than a truncated Date because it
     * is only ever grouped and compared for equality, and a string makes the
     * bucket boundary explicit in the stored document instead of implied by
     * whatever timezone the server happened to be in.
     */
    dayKey: { type: String, required: true, index: true },

    /** Repeat interactions inside the same day. Starts at 1. */
    occurrences: { type: Number, default: 1, min: 1 },

    /** Furthest point reached, as a percentage. Only meaningful for play. */
    furthestPercent: { type: Number, min: 0, max: 100, default: 0 },

    /** Set once a member signs in, so their history follows them. */
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', default: null, index: true },
  },
  { timestamps: true }
);

/** The dedupe key. Upserts target this exactly. */
mediaEngagementSchema.index(
  { visitorId: 1, targetType: 1, targetId: 1, action: 1, dayKey: 1 },
  { unique: true }
);

/** Serves the day-by-day trend on the dashboard without a collection scan. */
mediaEngagementSchema.index({ targetType: 1, action: 1, dayKey: 1 });

applyJsonTransform(mediaEngagementSchema);
export type MediaEngagementDoc = HydratedDocument<InferSchemaType<typeof mediaEngagementSchema>>;
export const MediaEngagement = model('MediaEngagement', mediaEngagementSchema);

/** UTC day bucket. UTC, not local, so a deploy region change cannot shift history. */
export function dayKeyFor(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
