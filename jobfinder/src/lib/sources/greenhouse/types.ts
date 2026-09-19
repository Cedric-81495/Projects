import { z } from 'zod';

/**
 * Greenhouse public Job Board API.
 * GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 * Read access is unauthenticated; this is the same endpoint Greenhouse serves
 * employers' own careers pages from. Docs: developers.greenhouse.io/job-board.html
 */
export const greenhouseJobSchema = z.object({
  id: z.number(),
  title: z.string(),
  absolute_url: z.string(),
  updated_at: z.string().nullable().optional(),
  first_published: z.string().nullable().optional(),
  requisition_id: z.string().nullable().optional(),
  // Present on many boards; when it is, it saves a lookup for the real name.
  company_name: z.string().nullable().optional(),
  location: z.object({ name: z.string().nullable().optional() }).nullable().optional(),
  offices: z.array(z.object({ name: z.string().nullable().optional() })).nullable().optional(),
  departments: z.array(z.object({ name: z.string().nullable().optional() })).nullable().optional(),
  content: z.string().nullable().optional(),   // HTML, entity-escaped
  metadata: z.array(z.object({
    name: z.string().nullable().optional(),
    value: z.unknown().nullable().optional(),
  })).nullable().optional(),
});

export const greenhouseBoardSchema = z.object({
  jobs: z.array(greenhouseJobSchema),
  meta: z.object({ total: z.number().optional() }).partial().optional(),
});

export type GreenhouseJob = z.infer<typeof greenhouseJobSchema>;

export interface GreenhouseBoard {
  /** The path segment in boards.greenhouse.io/<token> */
  token: string;
  /** Display name; falls back to the token when absent. */
  company?: string;
  companyUrl?: string;
}
