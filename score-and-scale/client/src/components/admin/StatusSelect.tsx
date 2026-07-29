import { useState } from 'react'
import { humanise } from '../../lib/format'

interface StatusSelectProps {
  value: string
  options: readonly string[]
  onChange: (next: string) => Promise<void>
  label: string
}

/**
 * Inline status editor for admin tables.
 *
 * Optimistically shows the new value while the request is in flight, then
 * reverts on failure — a select that snaps back with no explanation reads as a
 * bug, so the error is surfaced as a title attribute on the control.
 */
export function StatusSelect({ value, options, onChange, label }: StatusSelectProps) {
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const displayed = pending ?? value

  async function apply(next: string) {
    if (next === value) return

    setPending(next)
    setError(null)

    try {
      await onChange(next)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Update failed')
    } finally {
      setPending(null)
    }
  }

  return (
    <select
      value={displayed}
      disabled={pending !== null}
      onChange={(event) => void apply(event.target.value)}
      aria-label={label}
      title={error ?? undefined}
      className={`rounded-lg border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink
        transition-colors focus:outline-none focus:ring-2 focus:ring-accent/45
        disabled:opacity-60 ${error ? 'border-critical/60' : 'border-line'}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {humanise(option)}
        </option>
      ))}
    </select>
  )
}
