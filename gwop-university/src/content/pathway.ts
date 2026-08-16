/* ═══════════════════════════════════════════════════════════════════════════
   THE 4-LEVEL PATHWAY  —  OWNER: MAUI  ·  APPROVED BY: SURPAUL
   Source: GWOP_Visual_Build_Package.pdf p.4 + p.5
   Safe to edit: label, goal, detail, role. Do not change `slug` or order.
   ═══════════════════════════════════════════════════════════════════════════ */
export const PATHWAY = [
  { slug: 'freshman',  n: 1, label: 'Freshman',  role: 'Foundation',
    goal: 'Build the foundation',
    detail: 'Credit · cash flow · banking · debt' },
  { slug: 'sophomore', n: 2, label: 'Sophomore', role: 'Readiness',
    goal: 'Become capital-ready',
    detail: 'Business setup · records · funding readiness' },
  { slug: 'junior',    n: 3, label: 'Junior',    role: 'Build + Scale',
    goal: 'Build + scale',
    detail: 'Revenue · capital · systems · protection' },
  { slug: 'senior',    n: 4, label: 'Senior',    role: 'Legacy',
    goal: 'Protect + legacy',
    detail: 'Assets · investing · estate · long-term wealth' },
] as const

export const CAPSTONE = 'Capstone: The Completed GWOP Blueprint'
