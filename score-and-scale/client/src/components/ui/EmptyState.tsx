import type { ReactNode } from 'react'

/**
 * Shown when a collection is legitimately empty.
 *
 * Distinct from a loading state and from an error: it says what belongs here
 * and, where useful, offers the action that fills it.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div
        className="mb-4 grid h-11 w-11 place-items-center rounded-full border border-line bg-raised text-subtle"
        aria-hidden="true"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7h16M4 12h10M4 17h7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-[0.9375rem] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
