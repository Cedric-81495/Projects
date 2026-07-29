import type { ReactNode } from 'react'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonText } from '../ui/Skeleton'

export interface Column<T> {
  key: string
  header: string
  /** Cell renderer. Kept generic so a column can render a badge or an action. */
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[] | null
  rowKey: (row: T) => string
  caption: string
  emptyTitle: string
  emptyDescription?: string
}

/**
 * Shared admin table.
 *
 * Exists so every admin screen gets the same loading, empty, and overflow
 * behaviour instead of each one reimplementing it. The wrapper scrolls
 * horizontally on narrow screens, which keeps wide tables usable on a phone
 * without the page itself scrolling sideways.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  if (rows === null) {
    return (
      <div className="px-5 py-5 sm:px-6">
        <SkeletonText lines={5} />
      </div>
    )
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-left">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle ${
                  column.className ?? ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-raised/50">
              {columns.map((column) => (
                <td key={column.key} className={`px-5 py-3.5 align-top ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
