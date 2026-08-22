/**
 * WHICH ROADMAP SOMEONE SEES.
 *
 * Selected from two answers: what they want to improve (Q1, the interest) and
 * where they are financially (Q2). Six versions, not one generated per person.
 *
 * That is a deliberate constraint, and it is worth writing down because it will
 * be questioned: a roadmap generated fresh for each attendee cannot be read
 * before the event, which means nobody can approve it, which means nobody can
 * say what four hundred people will actually be shown. Six versions can each be
 * proofread by Surpaul in an afternoon. Everyone still gets something written
 * for their situation.
 *
 * EVERY combination resolves, including the ones where someone skipped both
 * questions. Nobody reaches the end of seven questions and gets an empty page.
 */

import type { BlueprintSlug } from '@/content/blueprints'

/**
 * Q1 interest → the family of roadmap they belong in.
 *
 * Keyed on the CURRENT interest values in config/integrations.ts. If Felicia
 * confirms her new seven-option list, add those keys here — the fallback below
 * means an unmapped value degrades to a sensible roadmap rather than an error,
 * so this file cannot break a signup at the booth even mid-change.
 */
const FAMILY_BY_INTEREST: Record<string, BlueprintFamily> = {
  credit: 'credit',
  funding: 'funding',
  entrepreneurship: 'business',
  wealth: 'wealth',
  wellness: 'foundation',
  unspecified: 'foundation',

  // Felicia's proposed list, mapped ahead of the decision so the switch is
  // config-only when it comes. Harmless while these values are never sent.
  budgeting: 'foundation',
  business: 'business',
  investing: 'wealth',
  homeownership: 'wealth',
  insurance: 'foundation',
  overall: 'foundation',
}

type BlueprintFamily = 'credit' | 'funding' | 'business' | 'wealth' | 'foundation'

/**
 * Stage collapses to two, not four.
 *
 * 'Starting Over' and 'Getting Stable' need the same first move — stabilise,
 * then build. 'Building' and 'Ready to Grow' both already have something to work
 * with. Splitting into four would double the copy Surpaul has to approve for a
 * distinction the roadmaps would not actually make.
 */
function stageGroup(financialStage: string | null): 'early' | 'established' {
  return financialStage === 'building' || financialStage === 'ready_to_grow'
    ? 'established'
    : 'early'
}

/**
 * The resolution. Total, by construction — a missing or unrecognised answer
 * lands on the foundation roadmap rather than throwing.
 */
export function selectBlueprint(input: {
  interest: string | null
  financial_stage: string | null
}): BlueprintSlug {
  const family = (input.interest && FAMILY_BY_INTEREST[input.interest]) || 'foundation'
  const stage = stageGroup(input.financial_stage)

  if (family === 'foundation') return 'foundation'
  return `${family}-${stage}` as BlueprintSlug
}
