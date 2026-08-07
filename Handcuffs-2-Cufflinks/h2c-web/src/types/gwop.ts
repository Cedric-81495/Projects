import type { Entity, MediaAsset, Publishable } from './common';

export type ProgrammeKind =
  | 'Course'
  | 'Workshop'
  | 'Seminar'
  | 'Mentorship'
  | 'Initiative';

export interface GwopProgramme extends Entity, Publishable {
  slug: string;
  kind: ProgrammeKind;
  name: string;
  /** Human-readable duration, e.g. "6 weeks" or "Rolling". */
  length: string;
  summary: string;
  description?: string;
  outcomes?: string[];
  eligibility?: string;
  coverImage?: MediaAsset;
  capacity?: number;
  enrolledCount?: number;
}

export interface GwopEvent extends Entity, Publishable {
  slug: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  venue: string;
  address?: string;
  speakers: string[];
  registrationUrl?: string;
  capacity?: number;
  registeredCount?: number;
}

export interface GwopMember extends Entity {
  fullName: string;
  email: string;
  programmeIds: string[];
  attendanceRate?: number;
  completionStatus: 'enrolled' | 'in-progress' | 'completed' | 'withdrawn';
}

/** Impact reporting for the admin dashboard. */
export interface GwopImpactSummary {
  participants: number;
  programmesRunning: number;
  completionRate: number;
  successStories: number;
}
