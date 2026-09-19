import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors JobCard's layout so results do not jump when they arrive. */
export function JobCardSkeleton() {
  return (
    <article className="rounded-card border border-line bg-paper-raised p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0 rounded-card" />
      </div>
      <Skeleton className="mt-4 h-4 w-32" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </article>
  );
}

export function JobListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading jobs</span>
      <Skeleton className="h-4 w-24" />
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => <JobCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
