/**
 * Write-side submissions: newsletter, community stories, membership.
 *
 * When VITE_API_URL is set, these POST to the real backend. When it is NOT
 * set (static-only preview), they resolve optimistically after a short beat so
 * the site is demonstrably usable — and become real submissions the instant the
 * backend URL is configured. The wire format below is the backend contract.
 */
import { api, isApiConfigured } from './apiClient';

export type NewsletterInput = { email: string; source?: string };
export type MemberInput = { name: string; email: string; interests: string[] };
export type CommunityStoryInput = {
  name: string;
  email: string;
  title: string;
  story: string;
};

export type SubmitResult = { ok: true };

const PREVIEW_DELAY = 650;
const preview = (): Promise<SubmitResult> =>
  new Promise((resolve) => setTimeout(() => resolve({ ok: true }), PREVIEW_DELAY));

/** POST /api/newsletter */
export async function subscribeNewsletter(input: NewsletterInput): Promise<SubmitResult> {
  if (!isApiConfigured()) return preview();
  await api.post('newsletter', input);
  return { ok: true };
}

/** POST /api/members */
export async function joinMovement(input: MemberInput): Promise<SubmitResult> {
  if (!isApiConfigured()) return preview();
  await api.post('members', input);
  return { ok: true };
}

/** POST /api/community/stories (moderated before publish) */
export async function submitCommunityStory(input: CommunityStoryInput): Promise<SubmitResult> {
  if (!isApiConfigured()) return preview();
  await api.post('community/stories', input);
  return { ok: true };
}
