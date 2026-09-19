import { z } from 'zod';

export const employmentTypeSchema = z.enum([
  'full_time', 'part_time', 'contract', 'temporary', 'hourly', 'internship', 'other',
]);

export const workArrangementSchema = z.enum(['remote', 'hybrid', 'onsite', 'unknown']);

export const salaryPeriodSchema = z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']);

/**
 * The single shape every connector must produce. Nothing downstream —
 * dedupe, storage, search, UI — knows which site a job came from.
 */
export const normalizedJobSchema = z.object({
  sourceId: z.string().min(1),
  externalJobId: z.string().min(1),

  title: z.string().min(1).max(300),
  companyName: z.string().min(1).max(200),
  companyUrl: z.string().url().nullable(),

  descriptionHtml: z.string().nullable(),
  descriptionText: z.string().nullable(),

  locationRaw: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),

  employmentType: employmentTypeSchema,
  workArrangement: workArrangementSchema,

  salaryMin: z.number().positive().nullable(),
  salaryMax: z.number().positive().nullable(),
  salaryCurrency: z.string().length(3).nullable(),
  salaryPeriod: salaryPeriodSchema.nullable(),

  /** null when the source does not publish one — never substitute "now". */
  postedAt: z.date().nullable(),

  jobUrl: z.string().url(),
  skills: z.array(z.string().min(1).max(60)).max(30),
  category: z.string().nullable(),

  raw: z.unknown().optional(),
});

export type NormalizedJob = z.infer<typeof normalizedJobSchema>;

/** Validates and drops anything malformed rather than poisoning the database. */
export function validateJobs(
  candidates: unknown[],
  onInvalid?: (issue: string, candidate: unknown) => void,
): NormalizedJob[] {
  const out: NormalizedJob[] = [];
  for (const candidate of candidates) {
    const parsed = normalizedJobSchema.safeParse(candidate);
    if (parsed.success) {
      out.push(parsed.data);
    } else {
      onInvalid?.(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), candidate);
    }
  }
  return out;
}
