import { z } from 'zod';

/**
 * Shape confirmed against https://www.arbeitnow.com/api/job-board-api
 * (public, keyless). Unknown keys are tolerated; only these are relied on.
 */
export const arbeitnowJobSchema = z.object({
  slug: z.string(),
  company_name: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  remote: z.boolean().nullable().optional(),
  url: z.string(),
  tags: z.array(z.string()).nullable().optional(),
  job_types: z.array(z.string()).nullable().optional(),
  location: z.string().nullable().optional(),
  created_at: z.number().nullable().optional(),   // unix seconds
});

export const arbeitnowResponseSchema = z.object({
  data: z.array(arbeitnowJobSchema),
  links: z.object({ next: z.string().nullable().optional() }).partial().optional(),
  meta: z.object({ current_page: z.number().optional(), last_page: z.number().optional() })
    .partial().optional(),
});

export type ArbeitnowJob = z.infer<typeof arbeitnowJobSchema>;

export interface ArbeitnowVariant {
  key: string;
  endpoint: string;
  country?: string | null;
}
