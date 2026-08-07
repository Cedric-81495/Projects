/** GET /api/podcast/clips — short cuts reused across the site. */

export interface SeedClip {
  /** The pulled quote. */
  q: string;
  /** Attribution, e.g. "Ep 31 · Angela Ruiz". */
  who: string;
}

export const CLIPS: readonly SeedClip[] = [
  {
    q: 'The first ninety days decide the next ten years.',
    who: 'Ep 31 · Angela Ruiz',
  },
  {
    q: 'I stopped asking for a chance and started building a reason.',
    who: 'Ep 29 · Marcus Bell',
  },
  {
    q: 'My mother never once introduced me by my record.',
    who: 'Ep 27 · Nia Parks',
  },
  {
    q: 'Housing before hustle. Nothing holds without an address.',
    who: 'Ep 31 · Angela Ruiz',
  },
  {
    q: 'The suit was not the win. Showing up on time for a year was.',
    who: 'Ep 24 · The founder',
  },
  {
    q: 'Bring somebody with you or the door closes behind you.',
    who: 'Ep 22 · Ray Delgado',
  },
] as const;
