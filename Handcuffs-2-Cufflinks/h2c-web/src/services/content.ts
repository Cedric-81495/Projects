/**
 * Read-side data access for movement content.
 *
 * Each function tries the backend first (when VITE_API_URL is set) and falls
 * back to the bundled seed data in src/data on any failure. This keeps the
 * site fully functional as a static deploy and makes it live automatically
 * once the Express + MongoDB API is connected — no component changes needed.
 */
import { api, isApiConfigured } from './apiClient';
import {
  stories as seedStories,
  episodes as seedEpisodes,
  tracks as seedTracks,
  type Story,
  type Episode,
  type Track,
} from '@/data/content';

export type { Story, Episode, Track };

/** Backend list responses may be a bare array or { data: [...] }. Normalize both. */
function asList<T>(payload: unknown, fallback: T[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return fallback;
}

async function fetchOrSeed<T>(path: string, seed: T[]): Promise<T[]> {
  if (!isApiConfigured()) return seed;
  try {
    const payload = await api.get<unknown>(path);
    return asList<T>(payload, seed);
  } catch {
    // Network/parse/backend error → fall back to seed so the UI never breaks.
    return seed;
  }
}

export const getStories = () => fetchOrSeed<Story>('stories', seedStories);
export const getEpisodes = () => fetchOrSeed<Episode>('episodes', seedEpisodes);
export const getTracks = () => fetchOrSeed<Track>('tracks', seedTracks);

export type CommunityStory = { id: string; title: string; story: string; name: string };

/** Public gallery of approved community submissions. Empty until a backend exists. */
export async function getApprovedStories(): Promise<CommunityStory[]> {
  if (!isApiConfigured()) return [];
  try {
    const payload = await api.get<unknown>('community/stories');
    return asList<CommunityStory>(payload, []);
  } catch {
    return [];
  }
}
