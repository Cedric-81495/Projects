// ============================================================
// Content service — the single boundary between UI and data.
//
// By default it serves the typed local seed content. Set
// VITE_USE_API=true (and VITE_API_BASE) to read from the backend;
// component code above this layer never changes. Each getter is a
// real Promise and may legitimately resolve to an empty array —
// the UI handles that via useAsync + <AsyncContent>.
// ============================================================

import {
  lookbook,
  stories,
  categories,
  podcastEpisodes,
  podcastClips,
  guests,
  music,
  videos,
  faq,
  communityStories,
} from '@/data';
import type {
  LookbookEntry,
  Story,
  PodcastEpisode,
  PodcastClip,
  Guest,
  MusicRelease,
  VideoItem,
  FaqItem,
  CommunityStory,
} from '@/types';

export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
const USE_API = import.meta.env.VITE_USE_API === 'true';

/** Typed fetch helper. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/**
 * Serve from API when enabled, else from the local seed. If an API
 * read throws, fall back to the seed so the page still renders.
 */
async function serve<T>(path: string, seed: T): Promise<T> {
  if (!USE_API) return seed;
  try {
    return await http<T>(path);
  } catch (err) {
    console.warn(`[content] API "${path}" failed, using local seed.`, err);
    return seed;
  }
}

// ---------- Reads ----------
export const getLookbook = () => serve<LookbookEntry[]>('/lookbook', lookbook);
export const getStories = () => serve<Story[]>('/stories', stories);
export const getCategories = () => serve<string[]>('/stories/categories', categories);
export const getStoryById = async (id: string) =>
  (await getStories()).find((s) => s.id === id) ?? null;

export const getPodcast = () => serve<PodcastEpisode[]>('/podcast', podcastEpisodes);
export const getPodcastClips = () => serve<PodcastClip[]>('/podcast/clips', podcastClips);
export const getGuests = () => serve<Guest[]>('/podcast/guests', guests);

export const getMusic = () => serve<MusicRelease[]>('/music', music);
export const getVideos = () => serve<VideoItem[]>('/videos', videos);

export const getFaq = () => serve<FaqItem[]>('/faq', faq);
export const getCommunityStories = () =>
  serve<CommunityStory[]>('/community/stories', communityStories);

// ---------- Form submissions ----------
export interface StorySubmission {
  name: string; email: string; city?: string; country?: string;
  social?: string; title?: string; story?: string; video?: string; consent: boolean;
}
export async function submitStory(payload: StorySubmission): Promise<{ ok: boolean }> {
  if (USE_API) return http('/community/stories', { method: 'POST', body: JSON.stringify(payload) });
  await new Promise((r) => setTimeout(r, 400));
  console.info('[submitStory] (stub)', payload);
  return { ok: true };
}

export interface JoinSubmission {
  first: string; email: string; mobile?: string; country?: string; consent: boolean;
}
export async function submitJoin(payload: JoinSubmission): Promise<{ ok: boolean }> {
  if (USE_API) return http('/members', { method: 'POST', body: JSON.stringify(payload) });
  await new Promise((r) => setTimeout(r, 400));
  console.info('[submitJoin] (stub)', payload);
  return { ok: true };
}
