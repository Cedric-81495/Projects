import type { EmploymentType, SalaryPeriod, WorkArrangement } from '@/types';

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract',
  temporary: 'Temporary', hourly: 'Hourly', internship: 'Internship', other: 'Not specified',
};

export const ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site', unknown: 'Not specified',
};

const PERIOD_SUFFIX: Record<SalaryPeriod, string> = {
  hourly: '/hour', daily: '/day', weekly: '/week', monthly: '/month', yearly: '/year',
};

export function formatSalary(
  min: number | null, max: number | null,
  currency: string | null, period: SalaryPeriod | null,
): string | null {
  if (min == null && max == null) return null;
  const format = (value: number) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: currency ? 'currency' : 'decimal',
        currency: currency ?? undefined,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
  };
  const range = min != null && max != null && max > min
    ? `${format(min)}–${format(max)}`
    : format((min ?? max) as number);
  return period ? `${range}${PERIOD_SUFFIX[period]}` : range;
}

/**
 * Shows the real posting date when the source published one, and says plainly
 * when it is only the date we found the listing. The two are never conflated.
 */
export function formatFreshness(postedAt: string | null, discoveredAt: string): string {
  if (postedAt) return `Posted ${relativeTime(postedAt)}`;
  return `Found ${relativeTime(discoveredAt)} · no posting date given`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'recently';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'a month ago';
  if (months < 12) return `${months} months ago`;
  return 'over a year ago';
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'unknown' : d.toISOString().replace('T', ' ').slice(0, 16);
}

export function locationLine(
  locationRaw: string | null, arrangement: WorkArrangement, employment: EmploymentType,
): string {
  const parts: string[] = [];
  if (arrangement === 'remote') parts.push('Remote');
  else if (locationRaw) parts.push(locationRaw);
  else if (arrangement !== 'unknown') parts.push(ARRANGEMENT_LABELS[arrangement]);
  if (arrangement === 'hybrid' && locationRaw) parts[0] = `${locationRaw} · Hybrid`;
  if (employment !== 'other') parts.push(EMPLOYMENT_LABELS[employment]);
  return parts.join(' · ') || 'Location not specified';
}
