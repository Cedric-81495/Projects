import { useCallback, useEffect, useState } from 'react'
import { DataTable, type Column } from '../../components/admin/DataTable'
import { DocumentStatusBadge } from '../../components/dashboard/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { FormError, TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { ApiError, apiFetch } from '../../lib/api'
import { formatDate, formatFileSize } from '../../lib/format'

interface DocumentRow {
  id: string
  customerName: string
  customerEmail: string
  typeLabel: string
  status: string
  originalFilename: string
  sizeBytes: number
  reviewNote?: string
  createdAt: string
  downloadUrl: string
}

export function DocumentsReview() {
  const [rows, setRows] = useState<DocumentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<DocumentRow | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await apiFetch<{ documents: DocumentRow[] }>(
        '/api/documents/admin/all',
        signal ? { signal } : {},
      )
      setRows(data.documents)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError(
        caught instanceof ApiError && caught.code === 'INTEGRATION_NOT_CONFIGURED'
          ? 'Document storage is not configured on this environment.'
          : 'We could not load documents. Please refresh to try again.',
      )
      setRows([])
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function review(id: string, status: 'approved' | 'rejected', reviewNote = '') {
    setBusyId(id)
    setError(null)

    try {
      await apiFetch(`/api/documents/${id}/review`, {
        method: 'PATCH',
        body: { status, reviewNote },
      })
      await load()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That review could not be saved.')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmRejection() {
    if (!rejecting) return

    const target = rejecting
    setRejecting(null)
    await review(target.id, 'rejected', rejectNote)
    setRejectNote('')
  }

  const columns: Column<DocumentRow>[] = [
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
      key: 'document',
      header: 'Document',
      render: (row) => (
        <div className="min-w-0">
          <p className="text-ink">{row.typeLabel}</p>
          <p className="truncate text-xs text-subtle">
            {row.originalFilename} · {formatFileSize(row.sizeBytes)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div>
          <DocumentStatusBadge status={row.status} />
          {row.reviewNote && <p className="mt-1.5 text-xs text-muted">{row.reviewNote}</p>}
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (row) => (
        <span className="whitespace-nowrap text-muted">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/*
            The signed url expires in 15 minutes, so it is safe to expose here
            but will not work if copied and shared later.
          */}
          <a
            href={row.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent underline-offset-4 hover:underline"
          >
            View
          </a>

          {row.status !== 'approved' && (
            <Button
              variant="secondary"
              size="sm"
              disabled={busyId === row.id}
              onClick={() => void review(row.id, 'approved')}
            >
              Approve
            </Button>
          )}

          {row.status !== 'rejected' && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busyId === row.id}
              onClick={() => {
                setRejectNote('')
                setRejecting(row)
              }}
            >
              Reject
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">Documents</h1>
        <p className="mt-1.5 text-sm text-muted">
          Pending submissions first. A rejection requires a reason, which the customer sees.
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <FormError>{error}</FormError>
        </div>
      )}

      <Card>
        <CardHeader title="Review queue" />
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          caption="Submitted documents awaiting review"
          emptyTitle="Nothing to review"
          emptyDescription="Uploaded documents will appear here for approval."
        />
      </Card>

      <Modal
        open={rejecting !== null}
        title="Reject this document"
        description="The customer will see this reason and can upload a replacement, so be specific about what needs fixing."
        onClose={() => setRejecting(null)}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              // Enforced here as well as on the server, so the user is not
              // bounced by a validation error they could have been warned about.
              disabled={rejectNote.trim().length === 0}
              onClick={() => void confirmRejection()}
            >
              Reject document
            </Button>
          </>
        }
      >
        <TextField
          label="Reason"
          value={rejectNote}
          onChange={(event) => setRejectNote(event.target.value)}
          placeholder="e.g. The ID photo is cut off — please re-upload showing all four corners."
          required
        />
      </Modal>
    </div>
  )
}
