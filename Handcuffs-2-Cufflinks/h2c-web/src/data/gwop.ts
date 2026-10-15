/** GET /api/gwop/programmes */

export interface SeedProgramme {
  kind: 'Course' | 'Workshop' | 'Seminar' | 'Mentorship' | 'Initiative';
  name: string;
  len: string;
  note: string;
}

/**
 * GWOP's real offering, as a fallback until programmes are entered in the CMS.
 *
 * What stood here before was six invented programmes — resume workshops, youth
 * placements, a reentry course — rendered under a heading that says "what is
 * running now". None of them existed. Seeded placeholders are harmless on a
 * page of apparel photography and are not harmless on a page listing services
 * an organisation offers.
 *
 * These five are what GWOP University actually sells: four levels taken in
 * sequence, plus the one-to-one.
 */
export const PROGRAMMES: readonly SeedProgramme[] = [
  {
    kind: 'Course',
    name: 'Level 1 — Personal Credit',
    len: 'Self-paced',
    note: 'What a lender sees before they see you. Reading your reports, the five pillars they weigh, and the cleanup order that protects your score.',
  },
  {
    kind: 'Course',
    name: 'Level 2 — Business Foundation & Business Credit',
    len: 'Self-paced',
    note: 'Structure first. The entity, the paperwork behind it, and building a business profile that stands on its own.',
  },
  {
    kind: 'Course',
    name: 'Level 3 — Funding & Banking Strategy',
    len: 'Self-paced',
    note: 'Banking relationships, how underwriting actually decides, and being ready before you apply rather than after.',
  },
  {
    kind: 'Course',
    name: 'Level 4 — Execution, Capital & Wealth Strategy',
    len: 'Self-paced',
    note: 'What happens after the money arrives. Deploying capital, managing cash flow, and moving from borrower to lender.',
  },
  {
    kind: 'Mentorship',
    name: 'The Blueprint 1:1',
    len: 'One hour',
    note: 'A session with Beast walking through your own roadmap, rather than a course telling everybody the same thing.',
  },
];
