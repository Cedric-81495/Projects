import type { Entity, MediaAsset, Publishable, SeoMeta } from './common';

/**
 * Apparel is showcased, not sold. Engagement replaces the cart: likes,
 * favourites, votes, and notify-me are the signals that decide what gets
 * produced. Price and inventory fields exist but are optional so the same
 * model survives the move to preorder and then to commerce without a rewrite.
 */

export type CollectionSlug =
  | 'signature'
  | 'from-struggle-to-success'
  | 'executive-streetwear'
  | 'limited-drops'
  | 'accessories'
  | 'featured-looks';

export interface ApparelCollection extends Entity, Publishable {
  slug: CollectionSlug | string;
  name: string;
  /** One line on what this collection says about transformation. */
  premise: string;
  description: string;
  coverImage: MediaAsset;
  itemIds: string[];
  seo?: SeoMeta;
  displayOrder: number;
}

export interface SizeGuideRow {
  size: string;
  chestInches?: string;
  lengthInches?: string;
  note?: string;
}

export interface ApparelItem extends Entity, Publishable {
  slug: string;
  name: string;
  collectionId: string;
  /** Required by the guide: every piece carries its meaning. */
  story: string;
  wearYourStoryMessage: string;
  images: MediaAsset[];
  fitNotes: string;
  sizes: SizeGuideRow[];
  materials: string[];
  careInstructions: string[];
  /** Held for future use — surfaced only in preorder/commerce mode. */
  shippingNotes?: string;
  relatedItemIds: string[];
  engagement: ApparelEngagementSummary;

  /* Future commerce fields. Unused in showcase mode. */
  priceCents?: number;
  currency?: string;
  inStock?: boolean;
  variants?: ApparelVariant[];
}

export interface ApparelVariant {
  id: string;
  size: string;
  color: string;
  sku?: string;
  priceCents?: number;
  inStock?: boolean;
}

/** The metrics the CMS reports on to decide future releases. */
export interface ApparelEngagementSummary {
  likes: number;
  favorites: number;
  votes: number;
  notifyMeCount: number;
  shares: number;
  views: number;
}

export type EngagementAction = 'like' | 'favorite' | 'vote' | 'notify' | 'share' | 'view';

export interface EngagementRequest {
  itemId: string;
  action: EngagementAction;
  /** Present for notify-me; anonymous visitors may still register interest. */
  email?: string;
}

/** A complete styled outfit from the photoshoot — homepage section 5. */
export interface PhotoshootLook extends Entity, Publishable {
  lookNumber: number;
  title: string;
  /** What this look is saying. */
  statement: string;
  heroImage: MediaAsset;
  gallery: MediaAsset[];
  /** The individual pieces that make up the look. */
  itemIds: string[];
}
