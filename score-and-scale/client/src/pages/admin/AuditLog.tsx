import { useEffect, useState } from 'react'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { Card, CardHeader } from '../../components/ui/Card'
import { FormError } from '../../components/ui/Field'
import { apiFetch } from '../../lib/api'
import { formatDateTime, humanise } from '../../lib/format'

interface AuditEntry {
  id: string
  actorEmail: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  createdAt: string
}

export function AuditLog() {
  const [rows, setRows] = useState<AuditEntry[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    apiFetch<{ entries: AuditEntry[]; total: number }>('/api/admin/audit-log?limit=100', {
      signal: controller.signal,
    })
      .then((data) => {
        setRows(data.entries)
        setTotal(data.total)
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setError('We could not load the audit log. Please refresh to try again.')
        setRows([])
      })

    return () => controller.abort()
  }, [])

  const columns: Column<AuditEntry>[] = [
    {
      key: 'when',
      header: 'When',
      render: (row) => (
        <span className="whitespace-nowrap text-muted">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <span className="text-ink">{row.actorEmail || 'System'}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <span className="font-medium text-ink">{humanise(row.action.replace(/\./g, ' — '))}</span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (row) => (
        <div className="min-w-0">
          <p className="text-muted">{row.entityType}</p>
          <p className="truncate font-mono text-xs text-subtle">{row.entityId}</p>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (row) => {
        const keys = Object.keys(row.metadata ?? {})
        if (keys.length === 0) return <span className="text-subtle">—</span>

        return (
          <dl className="space-y-0.5 text-xs">
            {keys.map((key) => (
              <div key={key} className="flex gap-1.5">
                <dt className="text-subtle">{key}:</dt>
                <dd className="min-w-0 break-words text-muted">
                  {String(row.metadata[key] ?? '')}
                </dd>
              </div>
            ))}
          </dl>
        )
      },
    },
  ]

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">Audit log</h1>
        <p className="mt-1.5 text-sm text-muted">
          Append-only record of privileged actions. Entries cannot be edited or removed.
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <FormError>{error}</FormError>
        </div>
      )}

      <Card>
        <CardHeader title="Recent activity" description={rows ? `${total} total` : undefined} />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="Audit log entries"
          emptyTitle="No entries yet"
          emptyDescription="Administrative actions will be recorded here."
        />
      </Card>
    </div>
  )
}
