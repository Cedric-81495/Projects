import { useEffect, useState } from 'react'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { PaymentStatusBadge } from '../../components/dashboard/StatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import { FormError } from '../../components/ui/Field'
import { apiFetch } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'

interface PaymentRow {
  id: string
  customerName: string
  customerEmail: string
  programName: string
  amountCents: number
  currency: string
  status: string
  cardBrand: string
  cardLast4: string
  transactionId: string
  createdAt: string
}

export function PaymentsTable() {
  const [rows, setRows] = useState<PaymentRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    apiFetch<{ payments: PaymentRow[]; total: number }>('/api/admin/payments?limit=100', {
      signal: controller.signal,
    })
      .then((data) => {
        setRows(data.payments)
        setTotal(data.total)
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setError('We could not load payments. Please refresh to try again.')
        setRows([])
      })

    return () => controller.abort()
  }, [])

  const columns: Column<PaymentRow>[] = [
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
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-medium tabular-nums text-ink">
          {formatCurrency(row.amountCents, row.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className="whitespace-nowrap text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'transaction',
      header: 'Transaction',
      render: (row) => (
        <div className="min-w-0">
          {/* Monospaced so ids stay scannable when comparing against Braintree. */}
          <p className="truncate font-mono text-xs text-subtle">{row.transactionId}</p>
          {row.cardLast4 && (
            <p className="text-xs text-subtle">
              {row.cardBrand} ····{row.cardLast4}
            </p>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">Payments</h1>
        <p className="mt-1.5 text-sm text-muted">
          Every transaction across all customers, newest first.
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <FormError>{error}</FormError>
        </div>
      )}

      <Card>
        <CardHeader title="All payments" description={rows ? `${total} total` : undefined} />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="All customer payments"
          emptyTitle="No payments yet"
          emptyDescription="Transactions appear here once customers start checking out."
        />
      </Card>
    </div>
  )
}
