import { formatDateTime, humanise } from '../../lib/format'

export interface TimelineEntry {
  status: string
  changedAt?: string
  note?: string
}

/**
 * Renders an enrollment's audit trail.
 *
 * Newest first, because the current state is what a customer opens the dashboard
 * to check. The full history stays available below it.
 */
export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-subtle">No activity recorded yet.</p>
  }

  const ordered = [...entries].reverse()

  return (
    <ol className="relative space-y-4 pl-6">
      {/* Continuous rail behind the markers. */}
      <span className="absolute left-[0.3125rem] top-1.5 h-[calc(100%-0.75rem)] w-px bg-line" aria-hidden="true" />

      {ordered.map((entry, index) => (
        <li key={`${entry.status}-${entry.changedAt ?? index}`} className="relative">
          <span
            className={`absolute -left-6 top-1.5 grid h-2.5 w-2.5 place-items-center rounded-full ring-2 ring-surface ${
              index === 0 ? 'bg-accent' : 'bg-line'
            }`}
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-ink">{humanise(entry.status)}</p>
          <p className="mt-0.5 text-xs text-subtle">{formatDateTime(entry.changedAt)}</p>
          {entry.note && <p className="mt-1.5 text-xs leading-relaxed text-muted">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}
