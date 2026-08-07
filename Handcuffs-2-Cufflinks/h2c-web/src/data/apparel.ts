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
  likes: number;
  votes: number;
  tone: SlotTone;
}

export const APPAREL: readonly SeedApparel[] = [
  {
    id: 'a1',
    name: 'The Distance Hoodie',
    coll: 'signature',
    badge: 'Signature',
    meaning: 'Two words on the chest and the mileage on the sleeve. The first piece ever printed.',
    asset: 'H2C_Signature_DistanceHoodie_Front_3x4.jpg',
    likes: 1284,
    votes: 412,
    tone: '',
  },
  {
    id: 'a2',
    name: 'Cufflinks Tee',
    coll: 'signature',
    badge: 'Signature',
    meaning: 'Chrome type, gold two. The shirt people stop you about in the street.',
    asset: 'H2C_Signature_CufflinksTee_Worn_3x4.jpg',
    likes: 1876,
    votes: 604,
    tone: 'warm',
  },
  {
    id: 'a3',
    name: 'Zakim Bomber',
    coll: 'executive',
    badge: 'Executive',
    meaning: 'Streetwear cut, tailored shoulder. Built for the walk between the two versions of you.',
    asset: 'H2C_Executive_ZakimBomber_3x4.jpg',
    likes: 942,
    votes: 388,
    tone: 'em',
  },
  {
    id: 'a4',
    name: 'Legacy in Motion Crewneck',
    coll: 'struggle',
    badge: 'Struggle to Success',
    meaning: 'Emerald on obsidian. Heavyweight loopback, meant to outlast the season.',
    asset: 'H2C_Struggle_LegacyCrew_3x4.jpg',
    likes: 1104,
    votes: 521,
    tone: 'warm',
  },
  {
    id: 'a5',
    name: 'Visiting Hours Longsleeve',
    coll: 'struggle',
    badge: 'Struggle to Success',
    meaning: 'Named for the room where a lot of these stories actually turned.',
    asset: 'H2C_Struggle_VisitingHours_3x4.jpg',
    likes: 768,
    votes: 295,
    tone: '',
  },
  {
    id: 'a6',
    name: 'Boston Harbour Puffer',
    coll: 'limited',
    badge: 'Limited · 200',
    meaning: 'One run, numbered. Cold-weather piece for a cold-weather city.',
    asset: 'H2C_Limited_HarbourPuffer_3x4.jpg',
    likes: 1502,
    votes: 711,
    tone: 'em',
  },
  {
    id: 'a7',
    name: 'H2C Gold Cufflinks',
    coll: 'accessories',
    badge: 'Accessories',
    meaning: 'The literal version. Brushed brass, monogram face, boxed in emerald.',
    asset: 'H2C_Access_GoldCufflinks_1x1.jpg',
    likes: 2231,
    votes: 889,
    tone: 'warm',
  },
  {
    id: 'a8',
    name: 'Movement Cap',
    coll: 'accessories',
    badge: 'Accessories',
    meaning: 'Low crown, embroidered mark. The quiet way to wear it.',
    asset: 'H2C_Access_MovementCap_3x4.jpg',
    likes: 854,
    votes: 243,
    tone: '',
  },
  {
    id: 'a9',
    name: 'Look 08 Suit Study',
    coll: 'looks',
    badge: 'Featured Look',
    meaning: 'The tailoring from the final frame of the shoot. Made to order when it opens.',
    asset: 'H2C_Looks_Look08_Suit_3x4.jpg',
    likes: 1320,
    votes: 660,
    tone: 'em',
  },
  {
    id: 'a10',
    name: 'Charlestown Sweatsuit',
    coll: 'looks',
    badge: 'Featured Look',
    meaning: 'Look 01, head to toe. Where every one of these stories starts.',
    asset: 'H2C_Looks_Look01_Sweatsuit_3x4.jpg',
    likes: 1189,
    votes: 474,
    tone: '',
  },
  {
    id: 'a11',
    name: 'Second Chance Overshirt',
    coll: 'executive',
    badge: 'Executive',
    meaning: 'Workwear weight, boardroom collar. For the years that are both at once.',
    asset: 'H2C_Executive_SecondChance_3x4.jpg',
    likes: 690,
    votes: 207,
    tone: 'warm',
  },
  {
    id: 'a12',
    name: 'Season One Anniversary Tee',
    coll: 'limited',
    badge: 'Limited · 300',
    meaning: 'Four episodes, four names on the back. Printed once.',
    asset: 'H2C_Limited_SeasonOneTee_3x4.jpg',
    likes: 977,
    votes: 355,
    tone: '',
  },
] as const;

export const apparelById = (id: string): SeedApparel | undefined =>
  APPAREL.find((a) => a.id === id);
