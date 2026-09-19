'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Select } from '@/components/ui/input';
import { clearFilterKeys, countActiveFilters } from '@/lib/filters';

const JOB_TYPES = [
  ['', 'All job types'], ['full_time', 'Full-time'], ['part_time', 'Part-time'],
  ['contract', 'Contract'], ['temporary', 'Temporary'], ['hourly', 'Hourly'],
  ['internship', 'Internship'],
] as const;

const ARRANGEMENTS = [
  ['', 'Anywhere'], ['remote', 'Remote'], ['hybrid', 'Hybrid'], ['onsite', 'On-site'],
] as const;

const POSTED = [
  ['', 'Any time'], ['1', 'Today'], ['3', 'Last 3 days'], ['7', 'Last 7 days'],
  ['14', 'Last 14 days'], ['30', 'Last 30 days'],
] as const;

const SORTS = [
  ['recent', 'Most recent'], ['relevance', 'Relevance'],
  ['salary_desc', 'Salary: highest'], ['salary_asc', 'Salary: lowest'],
] as const;

const CURRENCIES = [['', 'Any currency'], ['USD', 'USD'], ['EUR', 'EUR'], ['GBP', 'GBP'], ['PHP', 'PHP']] as const;

export function JobFilters({ sources }: { sources: { id: string; name: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  // Keeps the controls usable while the server re-runs the search, and lets
  // the sidebar show that something is happening.
  const [pending, startTransition] = useTransition();

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    value ? next.set(key, value) : next.delete(key);
    next.delete('page');
    startTransition(() => router.push(`/jobs?${next.toString()}`));
  }, [params, router]);

  const field = (key: string) => params.get(key) ?? '';

  const activeCount = countActiveFilters(new URLSearchParams(params.toString()));

  const clearAll = useCallback(() => {
    const next = clearFilterKeys(new URLSearchParams(params.toString()));
    startTransition(() => router.push(`/jobs?${next.toString()}`));
  }, [params, router]);

  return (
    <aside
      className="self-start space-y-5 rounded-card border border-line bg-paper-raised p-4
                 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
      aria-busy={pending}
    >
      {/*
        Pinned to the top of the sidebar's own scroll area: the sidebar can
        scroll internally on short viewports, and "Clear filters" is exactly
        the control you should never have to hunt for.
      */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-baseline justify-between gap-2
                      border-b border-line bg-paper-raised px-4 pb-2 pt-4">
        <p className="text-sm font-medium text-ink">
          Filters{activeCount > 0 && (
            <span className="ml-1.5 font-normal text-ink-muted">({activeCount})</span>
          )}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="text-sm text-moss-deep underline-offset-2 hover:underline disabled:opacity-50"
          >
            Clear filters
          </button>
        )}
      </div>

      <Field label="Job type">
        <Select value={field('type')} onChange={(e) => update('type', e.target.value)}>
          {JOB_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </Field>

      <Field label="Work arrangement">
        <Select value={field('arrangement')} onChange={(e) => update('arrangement', e.target.value)}>
          {ARRANGEMENTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </Field>

      <Field label="Date posted">
        <Select value={field('posted')} onChange={(e) => update('posted', e.target.value)}>
          {POSTED.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </Field>

      <Field label="Sort by">
        <Select value={field('sort') || 'recent'} onChange={(e) => update('sort', e.target.value)}>
          {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </Field>

      {sources.length > 1 && (
        <Field label="Source">
          <Select value={field('source')} onChange={(e) => update('source', e.target.value)}>
            <option value="">All sources</option>
            {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
      )}

      <div className="space-y-2 border-t border-line pt-4">
        <p className="text-sm font-medium text-ink">Salary</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            key={`min-${field('salaryMin')}`}
            type="number" inputMode="numeric" placeholder="Min" defaultValue={field('salaryMin')}
            aria-label="Minimum salary"
            onBlur={(e) => update('salaryMin', e.target.value)}
            className="h-9 rounded-card border border-line bg-paper-raised px-2 text-sm"
          />
          <input
            key={`max-${field('salaryMax')}`}
            type="number" inputMode="numeric" placeholder="Max" defaultValue={field('salaryMax')}
            aria-label="Maximum salary"
            onBlur={(e) => update('salaryMax', e.target.value)}
            className="h-9 rounded-card border border-line bg-paper-raised px-2 text-sm"
          />
        </div>
        <Select value={field('currency')} onChange={(e) => update('currency', e.target.value)}>
          {CURRENCIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <label className="flex items-start gap-2 text-sm text-ink-muted">
          <input
            type="checkbox" checked={field('salaryOnly') === '1'}
            onChange={(e) => update('salaryOnly', e.target.checked ? '1' : '')}
            className="mt-0.5 accent-moss"
          />
          <span>Only jobs that publish a salary</span>
        </label>
        <p className="text-xs text-ink-muted">
          Salary amounts compare as yearly equivalents. Jobs without a salary stay in your
          results unless you tick the box.
        </p>
      </div>

      {pending && (
        <p className="text-xs text-moss-deep" role="status">Updating results…</p>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
