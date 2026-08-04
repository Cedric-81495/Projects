export type Story = {
  id: string;
  title: string;
  guest: string;
  chapter: string;
  duration: string;
  blurb: string;
};

export const stories: Story[] = [
  {
    id: 's-01',
    title: 'The First Knot',
    guest: 'Marcus Vale',
    chapter: 'Docuseries \u00b7 Ep. 01',
    duration: '22 min',
    blurb: 'A returning citizen learns to tie a tie the morning of his first interview in eleven years.',
  },
  {
    id: 's-02',
    title: 'Room to Grow',
    guest: 'Deja Okafor',
    chapter: 'Docuseries \u00b7 Ep. 02',
    duration: '18 min',
    blurb: 'From a shared halfway house to a kitchen of her own, one plate at a time.',
  },
  {
    id: 's-03',
    title: 'Second Shift',
    guest: 'Ray Delgado',
    chapter: 'Docuseries \u00b7 Ep. 03',
    duration: '26 min',
    blurb: 'A father rebuilds trust on the night shift, teaching his son the trade that saved him.',
  },
];

export type Episode = {
  id: string;
  number: string;
  title: string;
  guest: string;
  duration: string;
};

export const episodes: Episode[] = [
  { id: 'p-12', number: '012', title: 'What the Yard Taught Me About Patience', guest: 'w/ Andre Boone', duration: '54 min' },
  { id: 'p-11', number: '011', title: 'Hiring the Formerly Incarcerated', guest: 'w/ Lena Marsh', duration: '48 min' },
  { id: 'p-10', number: '010', title: 'Fatherhood After a Sentence', guest: 'w/ Ray Delgado', duration: '61 min' },
];

export type Track = {
  id: string;
  title: string;
  artist: string;
  length: string;
};

export const tracks: Track[] = [
  { id: 't-01', title: 'Cufflink (Intro)', artist: 'Kitchen Muzik', length: '2:41' },
  { id: 't-02', title: 'Free Hands', artist: 'Kitchen Muzik ft. J. Rowe', length: '3:58' },
  { id: 't-03', title: 'Halfway', artist: 'Kitchen Muzik', length: '4:12' },
  { id: 't-04', title: 'Suit & Scars', artist: 'Kitchen Muzik', length: '3:27' },
];

export const founder = {
  name: 'The Founder',
  role: 'Creator of Handcuffs 2 Cufflinks',
  quote:
    'I wore both. I know exactly what it costs to trade one for the other \u2014 and I know no one should have to pay it alone.',
  bio:
    'Handcuffs 2 Cufflinks began as one person\u2019s refusal to be defined by the worst thing that ever happened to them. It grew into a platform for everyone walking the same distance.',
};

export type EcosystemBrand = {
  id: string;
  name: string;
  role: string;
  body: string;
};

export const ecosystem: EcosystemBrand[] = [
  {
    id: 'gwop',
    name: 'GWOP',
    role: 'Opportunity engine',
    body: 'Connects the movement to real work \u2014 employers, training, and the first honest paycheck on the other side.',
  },
  {
    id: 'kitchen-muzik',
    name: 'Kitchen Muzik Management',
    role: 'Creative arm',
    body: 'The sound of transformation. Artists telling the story in a language a documentary can\u2019t reach.',
  },
];
