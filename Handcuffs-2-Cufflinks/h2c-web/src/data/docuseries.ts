/** GET /api/docuseries/episodes */

export interface SeedEpisode {
  n: string;
  title: string;
  guest: string;
  len: string;
  /** One-line teaser. */
  line: string;
  asset: string;
}

export const EPISODES: readonly SeedEpisode[] = [
  {
    n: '01',
    title: 'The room you grow up in',
    guest: 'Tasha W. · Mattapan',
    len: '21 min',
    line: 'A single mother finishes the degree she started twelve years earlier.',
    asset: 'H2C_Docu_Ep01_Poster_16x9.jpg',
  },
  {
    n: '02',
    title: 'Nobody is coming',
    guest: 'Elias K. · Chelsea',
    len: '26 min',
    line: 'Deported at nine, back at nineteen, running two food trucks at thirty.',
    asset: 'H2C_Docu_Ep02_Poster_16x9.jpg',
  },
  {
    n: '03',
    title: 'Clean for the ninth time',
    guest: 'Ray D. · Quincy',
    len: '23 min',
    line: 'Eight relapses, one sponsor who refused to change his number.',
    asset: 'H2C_Docu_Ep03_Poster_16x9.jpg',
  },
  {
    n: '04',
    title: 'The room you leave behind',
    guest: 'Marcus B. · Dorchester',
    len: '24 min',
    line: 'Line cook, then eight years inside, then a four-person crew of his own.',
    asset: 'H2C_Docu_Ep04_Poster_16x9.jpg',
  },
  {
    n: '05',
    title: 'Her father’s name',
    guest: 'Nia P. · Roxbury',
    len: '25 min',
    line: 'She kept the surname and rebuilt what it meant on her street.',
    asset: 'H2C_Docu_Ep05_Poster_16x9.jpg',
  },
  {
    n: '06',
    title: 'Twelve square feet',
    guest: 'Sam O. · Lynn',
    len: '22 min',
    line: 'From a shelter cot to a barbershop chair with his name on the mirror.',
    asset: 'H2C_Docu_Ep06_Poster_16x9.jpg',
  },
] as const;
