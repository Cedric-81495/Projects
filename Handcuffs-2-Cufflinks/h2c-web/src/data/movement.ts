export type JourneyStage = {
  index: string;
  key: string;
  label: string;
  line: string;
};

/** The core user journey from the platform brief — a real, ordered sequence. */
export const journey: JourneyStage[] = [
  { index: '01', key: 'discover', label: 'Discover', line: 'You find the movement.' },
  { index: '02', key: 'understand', label: 'Understand', line: 'You learn what the symbol means.' },
  { index: '03', key: 'experience', label: 'Experience', line: 'You watch, listen, and feel it.' },
  { index: '04', key: 'inspired', label: 'Be inspired', line: 'A story lands close to home.' },
  { index: '05', key: 'participate', label: 'Participate', line: 'You share your own chapter.' },
  { index: '06', key: 'belong', label: 'Belong', line: 'You become part of the movement.' },
];

export type Value = { title: string; body: string };

export const values: Value[] = [
  {
    title: 'Restraint isn\u2019t the ending',
    body: 'The handcuff is a chapter, not a verdict. Every story here begins somewhere hard and refuses to stay there.',
  },
  {
    title: 'Refinement is earned',
    body: 'The cufflink is what a person builds on the other side \u2014 discipline, dignity, and a life that fits.',
  },
  {
    title: 'Nobody transforms alone',
    body: 'Change holds when it\u2019s witnessed. The community is the accountability, the proof, and the welcome.',
  },
];

export const symbol = {
  headline: 'From handcuffs to cufflinks.',
  body:
    'One is fastened to you. The other, you fasten yourself. The distance between them is the whole movement \u2014 the work of turning a past you didn\u2019t choose into a self you did.',
};
