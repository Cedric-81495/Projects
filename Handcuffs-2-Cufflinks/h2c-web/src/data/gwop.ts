/** GET /api/gwop/programmes */

export interface SeedProgramme {
  kind: 'Course' | 'Workshop' | 'Seminar' | 'Mentorship' | 'Initiative';
  name: string;
  len: string;
  note: string;
}

export const PROGRAMMES: readonly SeedProgramme[] = [
  {
    kind: 'Course',
    name: 'Money, plainly',
    len: '6 weeks',
    note: 'Budgeting, credit, banking after a record, and the paperwork nobody explains.',
  },
  {
    kind: 'Workshop',
    name: 'Build the resume',
    len: '1 day',
    note: 'How to write the years you cannot hide, and interview through them.',
  },
  {
    kind: 'Mentorship',
    name: 'One consistent adult',
    len: '6 months',
    note: 'Trained mentor pairings, two hours a month, matched by trade.',
  },
  {
    kind: 'Course',
    name: 'Start the business',
    len: '8 weeks',
    note: 'Registration, licensing, pricing and the first ten customers.',
  },
  {
    kind: 'Initiative',
    name: 'Youth: first job',
    len: 'Rolling',
    note: 'For 14 to 18s. Working papers, interviews, and a placement partner.',
  },
  {
    kind: 'Seminar',
    name: 'Reentry: first 90 days',
    len: '2 days',
    note: 'Housing, ID, benefits, probation and employment, in order.',
  },
] as const;
