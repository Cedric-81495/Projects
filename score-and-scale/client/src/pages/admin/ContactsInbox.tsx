import { useCallback, useEffect, useState } from 'react'
import { StatusSelect } from '../../components/admin/StatusSelect'
import { Badge } from '../../components/ui/Badge'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormError } from '../../components/ui/Field'
import { SkeletonText } from '../../components/ui/Skeleton'
import { apiFetch } from '../../lib/api'
import { formatDateTime, humanise } from '../../lib/format'

const STATUSES = ['new', 'read', 'archived'] as const

interface Submission {
  id: string
  name: string
  email: string
  phone: string
  topic: string
  message: string
  status: string
  createdAt: string
}

export function ContactsInbox() {
  const [rows, setRows] = useState<Submission[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await apiFetch<{ submissions: Submission[] }>(
        '/api/admin/contacts?limit=100',
        signal ? { signal } : {},
      )
      setRows(data.submissions)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError('We could not load the inbox. Please refresh to try again.')
      setRows([])
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">Contact inbox</h1>
        <p className="mt-1.5 text-sm text-muted">Enquiries from the funnel and contact page.</p>
      </header>

      {error && (
        <div className="mb-6">
          <FormError>{error}</FormError>
        </div>
      )}

      {rows === null ? (
        <Card>
          <div className="px-6 py-6">
            <SkeletonText lines={5} />
          </div>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            title="No enquiries yet"
            description="Messages from the contact form will appear here."
          />
        </Card>
      ) : (
        /*
          A card list rather than a table: the message body is free text of
          arbitrary length, which a fixed-column table would either truncate or
          let blow out the row height.
        */
        <ul className="space-y-4">
          {rows.map((submission) => (
            <li key={submission.id}>
              <Card>
                <CardHeader
                  title={
                    <span className="flex flex-wrap items-center gap-2.5">
                      {submission.name}
                      {submission.status === 'new' && <Badge tone="accent">New</Badge>}
                    </span>
                  }
                  description={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={`mailto:${submission.email}`}
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        {submission.email}
                      </a>
                      {submission.phone && <span>{submission.phone}</span>}
                      <span>{humanise(submission.topic)}</span>
                      <span>{formatDateTime(submission.createdAt)}</span>
                    </span>
                  }
                  action={
                    <StatusSelect
                      value={submission.status}
                      options={STATUSES}
                      label={`Change status for the enquiry from ${submission.email}`}
                      onChange={async (next) => {
                        await apiFetch(`/api/admin/contacts/${submission.id}`, {
                          method: 'PATCH',
                          body: { status: next },
                        })
                        await load()
                      }}
                    />
                  }
                />
                <div className="px-5 py-5 sm:px-6">
                  {/* whitespace-pre-line preserves the sender's paragraph breaks. */}
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                    {submission.message}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
