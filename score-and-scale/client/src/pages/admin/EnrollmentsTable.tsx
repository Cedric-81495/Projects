import { useCallback, useEffect, useState } from 'react'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { StatusSelect } from '../../components/admin/StatusSelect'
import { StatusBadge } from '../../components/dashboard/StatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import { FormError } from '../../components/ui/Field'
import { apiFetch } from '../../lib/api'
import { formatDate } from '../../lib/format'

const STATUSES = ['pending_payment', 'active', 'in_review', 'funded', 'cancelled'] as const

interface EnrollmentRow {
  id: string
  customerName: string
  customerEmail: string
  programName: string
  status: string
  createdAt: string
  updatedAt: string
}

export function EnrollmentsTable() {
  const [rows, setRows] = useState<EnrollmentRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await apiFetch<{ enrollments: EnrollmentRow[]; total: number }>(
        '/api/admin/enrollments?limit=100',
        signal ? { signal } : {},
      )
      setRows(data.enrollments)
      setTotal(data.total)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError('We could not load enrollments. Please refresh to try again.')
      setRows([])
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const columns: Column<EnrollmentRow>[] = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{row.customerName || '—'}</p>
          <p className="truncate text-xs text-subtle">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Program',
      render: (row) => <span className="text-muted">{row.programName || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'change',
      header: 'Change status',
      render: (row) => (
        <StatusSelect
          value={row.status}
          options={STATUSES}
          label={`Change status for ${row.customerEmail}`}
          onChange={async (next) => {
            await apiFetch(`/api/enrollments/${row.id}/status`, {
              method: 'PATCH',
              body: { status: next },
            })
            // Re-fetch so the badge, the timeline, and updatedAt all agree.
            await load()
          }}
        />
      ),
    },
    {
      key: 'created',
      header: 'Enrolled',
      render: (row) => <span className="whitespace-nowrap text-muted">{formatDate(row.createdAt)}</span>,
    },
  ]

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">Enrollments</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every enrollment across all customers. Status changes are audit-logged and notify the
          customer.
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <FormError>{error}</FormError>
        </div>
      )}

      <Card>
        <CardHeader
          title="All enrollments"
          description={rows ? `${total} total` : undefined}
        />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="All customer enrollments"
          emptyTitle="No enrollments yet"
          emptyDescription="Enrollments appear here as soon as a customer completes checkout."
        />
      </Card>
    </div>
  )
}
