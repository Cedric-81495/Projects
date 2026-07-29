import { Skeleton } from '../ui/Skeleton'

interface KpiCardProps {
  label: string
  value: string | null
  hint?: string
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</p>

      {value === null ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-3 text-[1.75rem] font-semibold leading-none tabular-nums tracking-[-0.02em] text-ink">
          {value}
        </p>
      )}

      {hint && <p className="mt-2 text-xs text-subtle">{hint}</p>}
    </div>
  )
}
