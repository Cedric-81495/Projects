/** GET /api/kmm/releases */

export interface SeedRelease {
  title: string;
  artist: string;
  kind: 'Single' | 'Album' | 'Mixtape' | 'Music video';
  year: string;
  note: string;
}

export const MUSIC: readonly SeedRelease[] = [
  {
    title: 'Cufflinks',
    artist: 'D. Ramos',
    kind: 'Single',
    year: '2026',
    note: 'The title track of the movement. Produced in-house.',
  },
  {
    title: 'Visiting Hours',
    artist: 'D. Ramos',
    kind: 'Single',
    year: '2025',
    note: 'Written on the back of a commissary sheet.',
  },
  {
    title: 'The Kitchen Tapes Vol. 1',
    artist: 'Various',
    kind: 'Mixtape',
    year: '2025',
    note: 'Nine tracks, one beat pack, the whole roster.',
  },
] as const;
