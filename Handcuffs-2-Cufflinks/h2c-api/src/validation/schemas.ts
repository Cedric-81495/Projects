import { z } from 'zod';

export const newsletterSchema = z.object({
  email: z.string().email('A valid email is required.'),
  source: z.string().max(60).optional(),
});

export const memberSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(120),
  email: z.string().email('A valid email is required.'),
  interests: z.array(z.string().max(80)).max(20).default([]),
});

export const communityStorySchema = z.object({
  name: z.string().min(1, 'Name is required.').max(120),
  email: z.string().email('A valid email is required.'),
  title: z.string().min(1, 'A title is required.').max(160),
  story: z.string().min(20, 'Please share a little more of your story.').max(10_000),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type CommunityStoryInput = z.infer<typeof communityStorySchema>;

// ── Admin ──
export const loginSchema = z.object({
  email: z.string().email('A valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const moderateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

const contentBase = {
  slug: z.string().min(1).max(120),
  published: z.boolean().optional(),
  order: z.number().int().optional(),
};

export const storyInputSchema = z.object({
  ...contentBase,
  title: z.string().min(1).max(200),
  guest: z.string().min(1).max(160),
  chapter: z.string().min(1).max(160),
  duration: z.string().min(1).max(40),
  blurb: z.string().min(1).max(600),
});

export const episodeInputSchema = z.object({
  ...contentBase,
  number: z.string().min(1).max(20),
  title: z.string().min(1).max(200),
  guest: z.string().min(1).max(160),
  duration: z.string().min(1).max(40),
});

export const trackInputSchema = z.object({
  ...contentBase,
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(160),
  length: z.string().min(1).max(20),
});

// Partial variants for PATCH.
export const storyPatchSchema = storyInputSchema.partial();
export const episodePatchSchema = episodeInputSchema.partial();
export const trackPatchSchema = trackInputSchema.partial();
