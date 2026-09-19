/**
 * Keys the filter sidebar owns. `q` and `location` belong to the search box,
 * so clearing filters must never discard the search someone just typed.
 */
export const FILTER_KEYS = [
  'type', 'arrangement', 'posted', 'sort', 'source',
  'salaryMin', 'salaryMax', 'currency', 'salaryOnly',
] as const;

/** `sort` only counts as active when it is not the default. */
export function countActiveFilters(params: URLSearchParams): number {
  return FILTER_KEYS.filter((key) => {
    const value = params.get(key);
    if (!value) return false;
    if (key === 'sort') return value !== 'recent';
    return true;
  }).length;
}

export function clearFilterKeys(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  FILTER_KEYS.forEach((key) => next.delete(key));
  next.delete('page');
  return next;
}
