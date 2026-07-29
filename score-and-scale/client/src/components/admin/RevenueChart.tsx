import { formatCurrency } from '../../lib/format'
import { Skeleton } from '../ui/Skeleton'

export interface RevenuePoint {
  label: string
  amountCents: number
}

/**
 * Monthly revenue bars.
 *
 * Hand-drawn with flex and divs rather than a charting library: this is a single
 * categorical series, and pulling in a full chart dependency for it would add
 * far more bundle weight than the feature justifies.
 */
export function RevenueChart({ points }: { points: RevenuePoint[] | null }) {
  if (points === null) {
    return <Skeleton className="h-44 w-full" />
  }

  if (points.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-subtle">
        No revenue recorded in the last six months.
      </p>
    )
  }

  // Guard against divide-by-zero when every month is empty.
  const max = Math.max(...points.map((point) => point.amountCents), 1)
  const total = points.reduce((sum, point) => sum + point.amountCents, 0)

  return (
    <div>
      <p className="text-sm text-muted">
        <span className="font-semibold tabular-nums text-ink">{formatCurrency(total)}</span> over the
        last {points.length} month{points.length === 1 ? '' : 's'}
      </p>

      <div className="mt-5 flex h-44 items-end gap-2 sm:gap-3">
        {points.map((point) => {
          const heightPercent = Math.max((point.amountCents / max) * 100, 2)

          return (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-accent/85 transition-[height] duration-500 ease-entrance"
                  style={{ height: `${heightPercent}%` }}
                  // The figures are read out by the table-like labels below, so
                  // the bar itself carries the accessible description.
                  role="img"
                  aria-label={`${point.label}: ${formatCurrency(point.amountCents)}`}
                />
              </div>
              <span className="w-full truncate text-center text-[0.6875rem] tabular-nums text-subtle">
                {point.label.slice(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
