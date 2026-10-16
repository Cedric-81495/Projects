/**
 * GET /api/apparel
 * Engagement counts come from the analytics collection, not the apparel
 * document, so they can be recomputed without touching content.
 */

export type SlotTone = '' | 'warm' | 'em';

export interface SeedApparel {
  id: string;
  name: string;
  coll: string;
  badge: string;
  /** The piece's meaning. Required on every item by the guide. */
  meaning: string;
  /** Filename the photographer must deliver for this position. */
  asset: string;
  /** The second angle, shown on hover in the grid. Optional. */
  assetAlt?: string;
  likes: number;
  votes: number;
  tone: SlotTone;
}

/**
 * The real inventory: 22 designs, keyed to the delivered photography.
 *
 * Filenames read `D<design>_S<shot>` — D1_S1 is the first shot of the first
 * design. The previous scheme used `_01_01` for the same thing and was read as
 * two designs rather than one design's two shots, which is exactly the mistake
 * a naming convention exists to prevent.
 *
 * `asset` is S1, which the grid shows. `assetAlt` is S2, revealed on hover,
 * and is absent on the three designs with only one photograph.
 *
 * Names and meanings are placeholders. The guide requires a written meaning on
 * every piece and the API refuses to publish one without it. Collection is
 * 'signature' throughout for the same reason — nothing has been assigned yet,
 * and one honest bucket beats a guess spread across six.
 */
export const APPAREL: readonly SeedApparel[] = [
  {
    id: 'a1',
    name: 'Black Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Black_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Black_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a2',
    name: 'Black Hoodie 02',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Black_D2_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Black_D2_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a3',
    name: 'Black Hoodie 03',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Black_D3_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Black_D3_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a4',
    name: 'Black Hoodie 04',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Black_D4_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Black_D4_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a5',
    name: 'Cream Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Cream_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Cream_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a6',
    name: 'Gold Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Gold_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Gold_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a7',
    name: 'Gray Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Gray_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Gray_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a8',
    name: 'Gray Hoodie 02',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Gray_D2_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Gray_D2_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a9',
    name: 'Gray Hoodie 03',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Gray_D3_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Gray_D3_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a10',
    name: 'Navy Blue Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_NavyBlue_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_NavyBlue_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a11',
    name: 'Navy Blue Hoodie 02',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_NavyBlue_D2_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_NavyBlue_D2_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a12',
    name: 'Olive Green Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_OliveGreen_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_OliveGreen_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a13',
    name: 'Orange Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Orange_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Orange_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a14',
    name: 'Pink Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Pink_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Pink_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a15',
    name: 'Red Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_Red_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_Red_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a16',
    name: 'Royal Blue Hoodie 01',
    coll: 'signature',
    badge: 'Hoodie',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Hoodie_RoyalBlue_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Hoodie_RoyalBlue_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a17',
    name: 'Jacket 01',
    coll: 'signature',
    badge: 'Jacket',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Jacket_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Jacket_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a18',
    name: 'Jacket 02',
    coll: 'signature',
    badge: 'Jacket',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Jacket_D2_S1_3x4.jpg',
    assetAlt: 'H2C_Jacket_D2_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a19',
    name: 'Long Sleeve 01',
    coll: 'signature',
    badge: 'Long Sleeve',
    meaning: 'Meaning to be written.',
    asset: 'H2C_LongSleeve_D1_S1_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
  {
    id: 'a20',
    name: 'Long Sleeve 02',
    coll: 'signature',
    badge: 'Long Sleeve',
    meaning: 'Meaning to be written.',
    asset: 'H2C_LongSleeve_D2_S1_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'warm',
  },
  {
    id: 'a21',
    name: 'Long Sleeve 03',
    coll: 'signature',
    badge: 'Long Sleeve',
    meaning: 'Meaning to be written.',
    asset: 'H2C_LongSleeve_D3_S1_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: 'em',
  },
  {
    id: 'a22',
    name: 'Tuxedo 01',
    coll: 'signature',
    badge: 'Tuxedo',
    meaning: 'Meaning to be written.',
    asset: 'H2C_Tuxedo_D1_S1_3x4.jpg',
    assetAlt: 'H2C_Tuxedo_D1_S2_3x4.jpg',
    likes: 0,
    votes: 0,
    tone: '',
  },
] as const;

export const apparelById = (id: string): SeedApparel | undefined =>
  APPAREL.find((a) => a.id === id);
