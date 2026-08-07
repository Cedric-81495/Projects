/** GET /api/community/stories?featured=true */

export interface SeedStory {
  /** The pulled quote. */
  q: string;
  name: string;
  where: string;
  /** Short summary of the journey. */
  arc: string;
}

export const STORIES: readonly SeedStory[] = [
  {
    q: 'I used to plan around my record. Now I plan around my daughter’s school calendar.',
    name: 'Devon R.',
    where: 'Dorchester, MA',
    arc: 'Incarceration to licensed trade',
  },
  {
    q: 'Nobody in my family had finished anything. I wanted to be the first, even if I was late.',
    name: 'Tasha W.',
    where: 'Mattapan, MA',
    arc: 'Interrupted degree to graduate',
  },
  {
    q: 'Nine attempts. The tenth one held because somebody finally stayed on the phone.',
    name: 'Ray D.',
    where: 'Quincy, MA',
    arc: 'Addiction to eleven years clean',
  },
  {
    q: 'I wore the shirt to my parole hearing. I know how that sounds. It worked.',
    name: 'Andre M.',
    where: 'Brockton, MA',
    arc: 'Parole to warehouse supervisor',
  },
  {
    q: 'My handcuffs were a marriage I was scared to leave. Same thing, different room.',
    name: 'Simone A.',
    where: 'Lynn, MA',
    arc: 'Leaving to owning her own salon',
  },
  {
    q: 'I came for the music and stayed for the workshops. Both of them changed the year.',
    name: 'Kofi B.',
    where: 'London, UK',
    arc: 'Unemployed to apprenticeship',
  },
] as const;
