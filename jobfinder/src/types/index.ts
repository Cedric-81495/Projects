export type EmploymentType =
  | 'full_time' | 'part_time' | 'contract' | 'temporary'
  | 'hourly' | 'internship' | 'other';

export type WorkArrangement = 'remote' | 'hybrid' | 'onsite' | 'unknown';

export type SalaryPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type AccessMethod =
  | 'official_api' | 'rss' | 'json_endpoint'
  | 'structured_data' | 'html' | 'unsupported';

export type RunStatus = 'running' | 'success' | 'partial' | 'failed';

export type SortOption = 'recent' | 'relevance' | 'salary_desc' | 'salary_asc';

export interface JobSearchParams {
  q?: string;
  location?: string;
  country?: string;
  employmentTypes?: EmploymentType[];
  arrangements?: WorkArrangement[];
  postedWithinDays?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryOnly?: boolean;
  sources?: string[];
  sort?: SortOption;
  page?: number;
  perPage?: number;
}

export interface JobSearchResult {
  id: string;
  sourceId: string;
  sourceName: string;
  externalJobId: string;
  title: string;
  companyName: string;
  companyUrl: string | null;
  excerpt: string;
  locationRaw: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  employmentType: EmploymentType;
  workArrangement: WorkArrangement;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: SalaryPeriod | null;
  postedAt: string | null;
  discoveredAt: string;
  lastSeenAt: string;
  jobUrl: string;
  skills: string[];
  category: string | null;
  alsoOnCount: number;
}
