import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only">Loading dashboard</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2 rounded-card border border-line bg-paper-raised p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="rounded-card border border-line">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-line p-3 last:border-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
