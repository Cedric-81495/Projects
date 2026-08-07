/** GET /api/kmm/artists */

export interface SeedArtist {
  name: string;
  city: string;
  since: string;
  note: string;
}

export const ARTISTS: readonly SeedArtist[] = [
  {
    name: 'D. Ramos',
    city: 'Roxbury',
    since: 'Signed 2024',
    note: 'Three singles out, debut album in production.',
  },
  {
    name: 'Lex Almeida',
    city: 'Brockton',
    since: 'Signed 2025',
    note: 'Writes for the roster and features on half of it.',
  },
  {
    name: 'Kitchen Band',
    city: 'Boston',
    since: 'In-house',
    note: 'The live unit behind the docuseries score.',
  },
] as const;
