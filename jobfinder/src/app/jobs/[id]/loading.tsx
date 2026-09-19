import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only">Loading job</span>
      <Skeleton className="h-4 w-32" />

      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-11 w-56 rounded-card" />
      </div>

      <div className="grid gap-x-8 gap-y-4 rounded-card border border-line bg-paper-raised p-5 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
