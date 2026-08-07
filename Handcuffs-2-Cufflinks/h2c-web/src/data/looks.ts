/** GET /api/looks — the eight photoshoot looks, in narrative order. */

export interface SeedLook {
  /** Two-digit look number. Order carries the narrative arc, so it matters. */
  n: string;
  title: string;
  note: string;
  /** The individual pieces that make up the look. */
  pieces: string[];
}

export const LOOKS: readonly SeedLook[] = [
  {
    n: '01',
    title: 'Where it started',
    note: 'Navy sweatsuit, hood up, Charlestown at dusk.',
    pieces: [
      'Charlestown Hoodie',
      'Sweatpant',
      'Court Sneaker',
    ],
  },
  {
    n: '02',
    title: 'The waiting room',
    note: 'Grey layers, harbour fence, midday.',
    pieces: [
      'Grey Crewneck',
      'Cargo Pant',
      'Movement Cap',
    ],
  },
  {
    n: '03',
    title: 'First paycheck',
    note: 'Workwear and boots on the site.',
    pieces: [
      'Second Chance Overshirt',
      'Utility Pant',
      'Work Boot',
    ],
  },
  {
    n: '04',
    title: 'The trade',
    note: 'Olive jacket, tool bag, early light.',
    pieces: [
      'Zakim Bomber',
      'Straight Denim',
      'Leather Belt',
    ],
  },
  {
    n: '05',
    title: 'The turn',
    note: 'Emerald knit on the harbour walkway.',
    pieces: [
      'Legacy Crewneck',
      'Tapered Trouser',
      'Runner',
    ],
  },
  {
    n: '06',
    title: 'Public speaking',
    note: 'Charcoal knit and coat, school auditorium.',
    pieces: [
      'Fine Knit Polo',
      'Wool Overcoat',
      'Chelsea Boot',
    ],
  },
  {
    n: '07',
    title: 'The business',
    note: 'Platinum shirt, no tie, own office.',
    pieces: [
      'Platinum Shirt',
      'Pleated Trouser',
      'H2C Cufflinks',
    ],
  },
  {
    n: '08',
    title: 'Where it goes',
    note: 'Pale tailoring, Financial District at night.',
    pieces: [
      'Look 08 Suit',
      'Silk Pocket Square',
      'H2C Gold Cufflinks',
    ],
  },
] as const;
