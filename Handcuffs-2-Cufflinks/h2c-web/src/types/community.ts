import type { Entity, MediaAsset, Publishable } from './common';

export interface CommunityStory extends Entity, Publishable {
  slug: string;
  /** The line that gets pulled out as the quote. */
  quote: string;
  fullStory?: string;
  authorName: string;
  authorLocation: string;
  /** Short summary of the journey, e.g. "Addiction to eleven years clean". */
  transformationArc: string;
  photo?: MediaAsset;
  isFeatured: boolean;
  /** Consent is required before anything is published. */
  consent: SubmissionConsent;
  moderation: ModerationRecord;
}

export interface SubmissionConsent {
  publishStory: boolean;
  publishName: boolean;
  publishImagery: boolean;
  contactForFollowUp: boolean;
  agreedAt: string;
}

export interface ModerationRecord {
  state: 'pending' | 'approved' | 'rejected' | 'needs-changes';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface StorySubmission {
  authorName: string;
  authorEmail: string;
  authorLocation: string;
  transformationArc: string;
  story: string;
  videoUrl?: string;
  consent: Omit<SubmissionConsent, 'agreedAt'>;
}

export interface VolunteerApplication {
  name: string;
  email: string;
  phone?: string;
  interests: string[];
  availability: string;
  message?: string;
}
