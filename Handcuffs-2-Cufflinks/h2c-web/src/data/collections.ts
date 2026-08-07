/** GET /api/collections */

export interface SeedCollection {
  slug: string;
  name: string;
}

export const COLLECTIONS: readonly SeedCollection[] = [
  { slug: 'signature', name: 'Signature Collection' },
  { slug: 'struggle', name: 'From Struggle to Success' },
  { slug: 'executive', name: 'Executive Streetwear' },
  { slug: 'limited', name: 'Limited Drops' },
  { slug: 'accessories', name: 'Accessories' },
  { slug: 'looks', name: 'Featured Looks' },
] as const;

export function collectionName(slug: string): string {
  return COLLECTIONS.find((c) => c.slug === slug)?.name ?? slug;
}
