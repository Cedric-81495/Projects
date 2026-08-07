/** Shared primitives used across every domain model. */

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/** Mongo documents come back with _id; the client normalises to id. */
export interface Entity extends Timestamps {
  id: string;
}

export type PublishStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface Publishable {
  status: PublishStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
}

export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

export interface MediaAsset extends Entity {
  kind: 'image' | 'video' | 'audio' | 'document';
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  /** Which brand's library this asset belongs to. */
  brand: 'h2c' | 'gwop' | 'kitchen';
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  code?: string;
  /** Field-level validation errors, keyed by field name. */
  errors?: Record<string, string[]>;
}
