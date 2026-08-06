// ============================================================
// Domain types — the shared contract between content and UI.
// These mirror the shape the backend API returns. The site is a
// movement platform, NOT a store: there are no prices, carts, or
// checkout. Apparel exists only as a lookbook ("wear your story").
// ============================================================

// ---------- Async lifecycle ----------
// Every data-driven surface moves through these states so the UI
// can always render *something* — never a blank or broken section.
export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

// ---------- Media ----------
// One unified descriptor for images, video and audio. Components
// consume `MediaAsset` and decide how to render; missing/partial
// assets degrade gracefully to a branded placeholder.
export type MediaKind = 'image' | 'video' | 'audio';
export type MediaProvider = 'file' | 'youtube' | 'vimeo';
export type MediaRatio = '2x3' | '3x4' | '4x5' | '1x1' | '16x9' | '21x9';

export interface MediaAsset {
  kind: MediaKind;
  /** Resolved URL. For youtube/vimeo this is the watch/share URL or bare id. */
  src?: string;
  /** Poster/thumbnail for video & audio, or the still for an image. */
  poster?: string;
  alt?: string;
  provider?: MediaProvider;
  /** Human duration label, e.g. "3:42" or "58 min". */
  duration?: string;
  ratio?: MediaRatio;
  /** Source asset filename — team-editable bookkeeping, optional. */
  file?: string;
}

// ---------- Storytelling (docuseries) ----------
export interface Story {
  id: string;
  n: string; // episode number, e.g. "01"
  cat: string; // category / kind of "handcuffs"
  dur: string;
  title: string; // may contain <br>
  blurb: string;
  struggle: string;
  turn: string;
  now: string;
  lessons: string[];
  quote: string;
  media: MediaAsset; // poster + optional video
}

// ---------- Podcast ----------
export interface PodcastEpisode {
  id: string;
  n: string;
  dur: string;
  title: string;
  blurb: string;
  media?: MediaAsset; // optional audio/video
}

export interface PodcastClip {
  id: string;
  t: string;
  dur: string;
  cap: string;
  media?: MediaAsset;
}

export interface Guest {
  name?: string;
  role?: string;
}

// ---------- Music (Kitchen Muzik Management) ----------
export interface MusicRelease {
  id: string;
  type: 'Album' | 'Single' | 'Mixtape';
  t: string;
  yr: string;
  media: MediaAsset; // cover art (image) + optional audio
}

export interface VideoItem {
  id: string;
  t: string;
  dur: string;
  media: MediaAsset; // poster + optional video
}

// ---------- Community ----------
export interface CommunityStory {
  id: string;
  loc: string;
  t: string;
  b: string;
  media?: MediaAsset;
}

// ---------- Lookbook (brand expression — no commerce) ----------
export interface LookPiece {
  t: string; // piece name
  v: string; // variant / material
}

export interface LookbookEntry {
  id: string;
  n: string; // chapter number "01"
  name: string;
  reg: string; // register (Streetwear … Luxury)
  ch: string; // chapter accent hex
  theme: string;
  media: MediaAsset;
  pieces: LookPiece[];
}

// ---------- Misc ----------
export interface FaqItem {
  q: string;
  a: string;
}
