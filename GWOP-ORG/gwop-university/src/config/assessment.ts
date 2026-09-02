/**
 * THE SEVEN QUESTIONS — Felicia, 2026-08-21.
 *
 * This file is the single source of truth. It renders the buttons, it validates
 * the API payload, and it is the list Jake builds his workflow conditions from.
 * Change an option here and all three follow. There is no second list to keep in
 * sync, which is the whole point.
 *
 * Wording is Felicia's, verbatim. Do not improve it.
 *
 * ⚠ Q1 IS NOT IN THIS FILE. Q1 is the interest question and it already exists as
 * INTERESTS in config/integrations.ts, writing to leads.interest with the
 * verbatim tag contract Jake matches on. Adding it here would create two lists
 * for one answer, which is the exact failure this file prevents.
 *
 * ⚠ Q1's OPTIONS ARE STILL UNDER DECISION. Felicia's proposed list replaces the
 * live five rather than extending it — only Credit and Business survive. Until
 * she confirms whether it applies everywhere or only at the event, INTERESTS
 * stays as it is. When the call comes it is a one-line edit there, because
 * nothing in the flow hardcodes those values.
 */

export interface AssessmentOption {
  /** Stored, sent to Jake, and matched on in his workflow conditions. */
  readonly value: string
  /** What the attendee reads. Never sent as the matching key. */
  readonly label: string
}

export interface AssessmentQuestion {
  /** Column name in `assessments`. Also the payload key Jake receives. */
  readonly field: AssessmentField
  /** Screen number as the attendee experiences it — Q1 is the interest step. */
  readonly step: number
  readonly prompt: string
  readonly options: readonly AssessmentOption[]
}

export type AssessmentField =
  | 'financial_stage'
  | 'credit_range'
  | 'emergency_fund'
  | 'budget_status'
  | 'currently_building'
  | 'biggest_blocker'

export const ASSESSMENT_QUESTIONS = [
  {
    field: 'financial_stage',
    step: 2,
    prompt: 'Where would you say you are financially?',
    options: [
      { value: 'starting_over', label: 'Starting Over' },
      { value: 'getting_stable', label: 'Getting Stable' },
      { value: 'building', label: 'Building' },
      { value: 'ready_to_grow', label: 'Ready to Grow' },
    ],
  },
  {
    field: 'credit_range',
    step: 3,
    /* Self-reported. We are not pulling credit and nothing here touches a
       bureau, which is why "Don't Know" is a first-class answer rather than a
       failure state — and, for a lot of people at this event, the honest one. */
    prompt: 'Do you know your current credit score range?',
    options: [
      { value: 'under_580', label: 'Under 580' },
      { value: '580_649', label: '580–649' },
      { value: '650_699', label: '650–699' },
      { value: '700_plus', label: '700+' },
      { value: 'unknown', label: "Don't Know" },
    ],
  },
  {
    field: 'emergency_fund',
    step: 4,
    prompt: 'Do you currently have an emergency fund?',
    options: [
      { value: 'none', label: 'None' },
      { value: 'under_1_month', label: 'Less Than 1 Month' },
      { value: '1_to_3_months', label: '1–3 Months' },
      { value: '3_plus_months', label: '3+ Months' },
    ],
  },
  {
    field: 'budget_status',
    step: 5,
    prompt: 'Do you have a monthly budget or spending plan?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    field: 'currently_building',
    step: 6,
    prompt: 'Are you currently building anything?',
    options: [
      { value: 'business', label: 'Business' },
      { value: 'homeownership', label: 'Homeownership' },
      { value: 'investments', label: 'Investments' },
      { value: 'retirement', label: 'Retirement' },
      { value: 'none_yet', label: 'None Yet' },
    ],
  },
  {
    field: 'biggest_blocker',
    step: 7,
    prompt: "What's the biggest thing holding you back right now?",
    options: [
      { value: 'debt', label: 'Debt' },
      { value: 'credit', label: 'Credit' },
      { value: 'income', label: 'Income' },
      { value: 'knowledge', label: 'Knowledge' },
      { value: 'consistency', label: 'Consistency' },
      { value: 'unsure', label: "Don't Know Where to Start" },
    ],
  },
] as const satisfies readonly AssessmentQuestion[]

/** Total screens including the interest question, for the progress indicator. */
export const TOTAL_STEPS = ASSESSMENT_QUESTIONS.length + 1

/**
 * Which activation these responses belong to.
 *
 * Set to 'test' in preview so Jake can filter and delete test contacts without
 * touching real ones. Anything that reaches his live workflow by accident during
 * testing is a real person receiving a real text.
 */
/* ⚠ LEFT UNCHANGED AFTER THE 8/30 DE-EVENTING — DELIBERATELY, BUT IT NEEDS A
   DECISION.

   This value is stamped on every assessment row. It was not changed with the
   rest of the event references because it is DATA, not copy: the six existing
   rows carry it, Jake's reporting groups on it, and rewriting it would break
   continuity with what has already been captured and delivered to his CRM.

   But it is now wrong going forward. The four leads captured on 31 Aug did not
   attend the event, and neither will anyone arriving from /credit — yet all of
   them are stamped as if they had. Every future lead inherits an event key for
   an afternoon in Cambridge they were never at.

   ⚠ THE FIX IS NOT A CODE CHANGE ALONE. Whatever replaces it has to match what
   Jake segments on in GHL, so it needs agreeing with him first. The likely
   answer is a neutral key for evergreen traffic — the funnel already carries
   its own attribution in utm_source, so the event key could simply become
   something like 'gwop-evergreen' for anyone not at a physical event.

   Overridable by NEXT_PUBLIC_EVENT_KEY, so a real future event can set its own
   without a deploy. */
export const EVENT_KEY =
  process.env.NEXT_PUBLIC_EVENT_KEY ?? 'egc-2026-08-30'

/**
 * Lookup used by the API to reject a value that was never on screen.
 *
 * Built with an explicit loop rather than Object.fromEntries: that returns a
 * plain index signature, so bridging it to Record<AssessmentField, …> needs a
 * cast the compiler cannot check — and a cast here would hide a genuinely
 * missing question rather than failing the build.
 */
export const ALLOWED_ANSWERS: Record<AssessmentField, ReadonlySet<string>> = (() => {
  const out = {} as Record<AssessmentField, ReadonlySet<string>>
  for (const q of ASSESSMENT_QUESTIONS) {
    out[q.field] = new Set<string>(q.options.map((o) => o.value))
  }
  return out
})()

export const ASSESSMENT_FIELDS = ASSESSMENT_QUESTIONS.map((q) => q.field)

/** Display label for a stored value. For the Blueprint and any admin view. */
export function labelFor(field: AssessmentField, value: string | null): string | null {
  if (!value) return null
  const q = ASSESSMENT_QUESTIONS.find((x) => x.field === field)
  return q?.options.find((o) => o.value === value)?.label ?? null
}
