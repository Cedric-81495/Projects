import { Skeleton } from '@/components/ui/skeleton';

export function JobFiltersSkeleton() {
  return (
    <aside className="self-start space-y-5 rounded-card border border-line bg-paper-raised p-4 lg:sticky lg:top-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-card" />
        </div>
      ))}
      <div className="space-y-2 border-t border-line pt-4">
        <Skeleton className="h-4 w-16" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-9 rounded-card" />
          <Skeleton className="h-9 rounded-card" />
        </div>
      </div>
    </aside>
  );
}
