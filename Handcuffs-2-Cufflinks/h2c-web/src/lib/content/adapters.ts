import type { SeedApparel, SlotTone } from '@/data/apparel';
import type { SeedArtist } from '@/data/artists';
import type { SeedCollection } from '@/data/collections';
import type { SeedEpisode } from '@/data/docuseries';
import type { SeedProgramme } from '@/data/gwop';
import type { SeedLook } from '@/data/looks';
import type { SeedRelease } from '@/data/music';
import type { SeedClip } from '@/data/podcast';
import type { SeedStory } from '@/data/stories';

/**
 * Translates API records into the shapes the public components already use.
 *
 * Written as an adapter layer rather than by rewriting every component to the
 * API's field names, for two reasons:
 *
 *   1. The seed data has to keep working. It is the fallback when the API is
 *      cold or unreachable, so both sources must produce the same shape or
 *      every component needs two rendering paths.
 *   2. It confines the coupling. When a field is renamed on the server, the
 *      break is one line in this file rather than a scavenger hunt through the
 *      feature folders.
 *
 * Every field the API can leave empty is defaulted here, so components never
 * have to test for a missing value that only occurs on half-finished records.
 */

/* ------------------------------------------------------------------ */
/* Shared shapes                                                       */
/* ------------------------------------------------------------------ */

export interface ApiImage {
  url?: string;
  alt?: string;
}

interface Publishable {
  id: string;
  slug?: string;
  status?: string;
}

/** Pulls a usable address out of an optional image, or an empty string. */
function imageUrl(image?: ApiImage): string {
  return image?.url ?? '';
}

/** "68 min" from a duration in seconds. Zero reads as unknown, not "0 min". */
export function minutesLabel(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  return `${Math.round(seconds / 60)} min`;
}

/* ------------------------------------------------------------------ */
/* Docuseries                                                          */
/* ------------------------------------------------------------------ */

export interface ApiDocuseriesEpisode extends Publishable {
  episodeNumber: string;
  seasonNumber?: number;
  title: string;
  teaser?: string;
  heroImage?: ApiImage;
  youtubeVideoId?: string;
  guest?: { name?: string; biography?: string };
  definingStruggle?: string;
  transformationStory?: string;
  keyLessons?: { heading?: string; detail?: string }[];
  durationSeconds?: number;
  isFeatured?: boolean;
}

/** The view shape adds what the API knows and the seed never did. */
export interface EpisodeView extends SeedEpisode {
  slug: string;
  youtubeVideoId: string;
  poster: string;
}

export function toEpisode(item: ApiDocuseriesEpisode): EpisodeView {
  return {
    n: item.episodeNumber,
    title: item.title,
    guest: item.guest?.name ?? '',
    len: minutesLabel(item.durationSeconds),
    line: item.teaser ?? '',
    // The placeholder spec is kept as the label when no image is attached yet,
    // which is what makes an unfinished record read as a shot list.
    asset: item.heroImage?.alt || `${item.title} — hero image`,
    slug: item.slug ?? item.id,
    youtubeVideoId: item.youtubeVideoId ?? '',
    poster: imageUrl(item.heroImage),
  };
}

/* ------------------------------------------------------------------ */
/* Podcast                                                             */
/* ------------------------------------------------------------------ */

export interface ApiPodcastEpisode extends Publishable {
  episodeNumber: string;
  title: string;
  summary?: string;
  coverImage?: ApiImage;
  youtubeVideoId?: string;
  guest?: { name?: string };
  keyTakeaways?: string[];
  durationSeconds?: number;
  isFeatured?: boolean;
}

export interface PodcastEpisodeView {
  n: string;
  title: string;
  guest: string;
  len: string;
  line: string;
  slug: string;
  youtubeVideoId: string;
  poster: string;
  takeaways: string[];
}

export function toPodcastEpisode(item: ApiPodcastEpisode): PodcastEpisodeView {
  return {
    n: item.episodeNumber,
    title: item.title,
    guest: item.guest?.name ?? '',
    len: minutesLabel(item.durationSeconds),
    line: item.summary ?? '',
    slug: item.slug ?? item.id,
    youtubeVideoId: item.youtubeVideoId ?? '',
    poster: imageUrl(item.coverImage),
    takeaways: item.keyTakeaways ?? [],
  };
}

export interface ApiPodcastClip extends Publishable {
  quote: string;
  attribution: string;
  youtubeVideoId?: string;
}

export function toClip(item: ApiPodcastClip): SeedClip {
  return { q: item.quote, who: item.attribution };
}

/* ------------------------------------------------------------------ */
/* Collections and apparel                                             */
/* ------------------------------------------------------------------ */

export interface ApiCollection extends Publishable {
  name: string;
  premise?: string;
  coverImage?: ApiImage;
  displayOrder?: number;
}

export function toCollection(item: ApiCollection): SeedCollection {
  return { slug: item.slug ?? item.id, name: item.name };
}

export interface ApiApparelItem extends Publishable {
  name: string;
  collectionId?: string | { slug?: string; _id?: string };
  badge?: string;
  story?: string;
  images?: ApiImage[];
  assetSpec?: string;
  engagement?: { likes?: number; votes?: number };
}

/**
 * Tone rotates by position rather than being stored.
 *
 * It is a purely visual variation across a grid — warm, emerald, plain — and
 * asking a VA to choose one per garment would be asking them to art-direct a
 * page they cannot see while filling in a form.
 */
const TONES: SlotTone[] = ['', 'warm', '', 'em'];

/**
 * `slugById` maps collection ids to slugs.
 *
 * Public apparel reads return `collectionId` as a raw id — the list endpoint
 * does not populate, and adding a join to every read to save one lookup on the
 * client would be the wrong trade. The pages that filter by collection already
 * hold the collection list, so they pass the map in.
 */
export function toApparel(
  item: ApiApparelItem,
  index = 0,
  slugById: Record<string, string> = {}
): SeedApparel {
  const collection = item.collectionId;
  const rawId =
    typeof collection === 'string' ? collection : (collection?._id ?? '');
  const collectionSlug =
    (typeof collection === 'object' ? collection?.slug : undefined) ?? slugById[rawId] ?? rawId;

  return {
    id: item.id,
    name: item.name,
    coll: collectionSlug,
    badge: item.badge ?? '',
    meaning: item.story ?? '',
    asset: item.images?.[0]?.url || item.assetSpec || `${item.name} — product photograph`,
    likes: item.engagement?.likes ?? 0,
    votes: item.engagement?.votes ?? 0,
    tone: TONES[index % TONES.length],
  };
}

export interface ApiLook extends Publishable {
  lookNumber: string;
  title: string;
  statement?: string;
  heroImage?: ApiImage;
  gallery?: ApiImage[];
  pieces?: string[];
}

export function toLook(item: ApiLook): SeedLook {
  return {
    n: item.lookNumber,
    title: item.title,
    note: item.statement ?? '',
    pieces: item.pieces ?? [],
  };
}

/* ------------------------------------------------------------------ */
/* Kitchen Muzik                                                       */
/* ------------------------------------------------------------------ */

export interface ApiArtist extends Publishable {
  name: string;
  biography?: string;
  city?: string;
  images?: ApiImage[];
  activeStatus?: 'active' | 'inactive';
}

export function toArtist(item: ApiArtist): SeedArtist {
  return {
    name: item.name,
    city: item.city ?? '',
    since: item.activeStatus === 'inactive' ? 'Archive' : 'On the roster',
    note: item.biography ?? '',
  };
}

export interface ApiRelease extends Publishable {
  title: string;
  type: 'single' | 'album' | 'mixtape' | 'music-video';
  artistNames?: string[];
  coverArt?: ApiImage;
  releaseDate?: string | null;
  note?: string;
}

const RELEASE_KIND: Record<string, SeedRelease['kind']> = {
  single: 'Single',
  album: 'Album',
  mixtape: 'Mixtape',
  'music-video': 'Music video',
};

export function toRelease(item: ApiRelease): SeedRelease {
  return {
    title: item.title,
    artist: item.artistNames?.join(', ') ?? '',
    kind: RELEASE_KIND[item.type] ?? 'Single',
    // A release with no date is upcoming, and saying so is more useful than a
    // blank column or a year invented from the record's creation date.
    year: item.releaseDate ? String(new Date(item.releaseDate).getFullYear()) : 'Coming',
    note: item.note ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* GWOP                                                                */
/* ------------------------------------------------------------------ */

export interface ApiProgramme extends Publishable {
  kind: SeedProgramme['kind'];
  name: string;
  length?: string;
  summary?: string;
  outcomes?: string[];
}

export function toProgramme(item: ApiProgramme): SeedProgramme {
  return {
    kind: item.kind,
    name: item.name,
    len: item.length ?? '',
    note: item.summary ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* Community                                                           */
/* ------------------------------------------------------------------ */

export interface ApiCommunityStory extends Publishable {
  quote?: string;
  fullStory?: string;
  authorName?: string;
  authorLocation?: string;
  transformationArc?: string;
  isFeatured?: boolean;
}

/**
 * The API has already replaced the name with "Anonymous" and cleared the
 * location for anyone who did not consent to being named, so nothing here has
 * to decide what may be shown — by the time a story reaches this function the
 * consent question has been settled server-side.
 */
export function toStory(item: ApiCommunityStory): SeedStory {
  return {
    q: item.quote || item.fullStory?.slice(0, 180) || '',
    name: item.authorName || 'Anonymous',
    where: item.authorLocation ?? '',
    arc: item.transformationArc ?? '',
  };
}
