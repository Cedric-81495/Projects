import type { Entity, MediaAsset, Publishable, SeoMeta } from './common';

/* ------------------------------------------------------------------------ */
/* Docuseries                                                                */
/* ------------------------------------------------------------------------ */

export interface DocuseriesEpisode extends Entity, Publishable {
  slug: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  teaser: string;
  heroImage: MediaAsset;
  /** YouTube video id — embedded on-site, never a redirect. */
  youtubeVideoId: string;
  guest: GuestProfile;
  /** The handcuffs. */
  definingStruggle: string;
  /** The cufflinks. */
  transformationStory: string;
  /** Exactly three, per the guide. */
  keyLessons: [string, string, string];
  relatedApparelIds: string[];
  seo?: SeoMeta;
}

export interface GuestProfile {
  name: string;
  biography: string;
  photo?: MediaAsset;
  role?: string;
  links?: { label: string; url: string }[];
}

/* ------------------------------------------------------------------------ */
/* Podcast                                                                   */
/* ------------------------------------------------------------------------ */

export interface PodcastEpisode extends Entity, Publishable {
  slug: string;
  episodeNumber: number;
  title: string;
  summary: string;
  coverImage: MediaAsset;
  youtubeVideoId: string;
  guest?: GuestProfile;
  keyTakeaways: string[];
  durationSeconds: number;
  audioPlatformLinks: AudioPlatformLink[];
  /** Short vertical cuts reused across the site. */
  clips: PodcastClip[];
  isFeatured: boolean;
}

export interface AudioPlatformLink {
  platform: 'spotify' | 'apple' | 'youtube' | 'amazon' | 'other';
  label: string;
  url: string;
}

export interface PodcastClip extends Entity {
  episodeId: string;
  title: string;
  youtubeVideoId: string;
  startSeconds?: number;
  endSeconds?: number;
  /** Where this clip is allowed to appear. */
  placements: ('home' | 'podcast' | 'movement' | 'community')[];
}

export interface GuestNomination {
  nomineeName: string;
  nomineeStory: string;
  nominatorName: string;
  nominatorEmail: string;
  relationship?: string;
  contactInfo?: string;
}

/* ------------------------------------------------------------------------ */
/* Music — Kitchen Muzik Management                                          */
/* ------------------------------------------------------------------------ */

export type ReleaseType = 'single' | 'album' | 'mixtape' | 'music-video';

export interface Artist extends Entity, Publishable {
  slug: string;
  name: string;
  biography: string;
  images: MediaAsset[];
  socialLinks: { platform: string; url: string }[];
  activeStatus: 'active' | 'inactive';
}

export interface MusicRelease extends Entity, Publishable {
  slug: string;
  title: string;
  type: ReleaseType;
  artistIds: string[];
  coverArt: MediaAsset;
  genres: string[];
  releaseDate: string;
  lyrics?: string;
  streamingLinks: StreamingLink[];
  youtubeVideoId?: string;
  audioAsset?: MediaAsset;
  credits: ProductionCredits;
  engagement: { plays: number; views: number; downloads: number };
  isFeatured: boolean;
}

export interface StreamingLink {
  platform: 'spotify' | 'apple-music' | 'youtube-music' | 'soundcloud' | 'tidal' | 'other';
  label: string;
  url: string;
}

export interface ProductionCredits {
  producers: string[];
  songwriters: string[];
  collaborators: string[];
  recordingStudios: string[];
  copyrightNotice?: string;
}
