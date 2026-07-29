import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, apiFetch } from '../../lib/api'
import { formatFileSize } from '../../lib/format'
import { uploadDocument, validateFile, type DocumentKind } from '../../lib/uploadClient'
import { Button } from '../ui/Button'
import { FormError } from '../ui/Field'
import { Spinner } from '../ui/Spinner'
import { DocumentStatusBadge } from './StatusBadge'

interface EnrollmentDocumentItem {
  id: string
  type: DocumentKind
  typeLabel: string
  status: 'pending' | 'approved' | 'rejected'
  originalFilename: string
  sizeBytes: number
  reviewNote?: string
  createdAt: string
  downloadUrl: string
}

const REQUIRED: { type: DocumentKind; label: string; help: string }[] = [
  { type: 'id', label: 'Photo ID', help: "Driver's licence or passport" },
  { type: 'credit_report', label: 'Credit report', help: 'A recent report from any bureau' },
  { type: 'business_doc', label: 'Business document', help: 'Formation documents or EIN letter' },
]

/**
 * Per-enrollment upload widget.
 *
 * Each required document type gets its own slot so the customer can see at a
 * glance what is outstanding, rather than facing a single generic file input.
 */
export function DocumentUpload({ enrollmentId }: { enrollmentId: string }) {
  const [documents, setDocuments] = useState<EnrollmentDocumentItem[] | null>(null)
  const [uploadingType, setUploadingType] = useState<DocumentKind | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await apiFetch<{ documents: EnrollmentDocumentItem[] }>(
          `/api/documents?enrollmentId=${encodeURIComponent(enrollmentId)}`,
          signal ? { signal } : {},
        )
        setDocuments(data.documents)
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return

        /**
         * A missing storage integration is a configuration problem, not
         * something the customer can act on, so it is reported plainly rather
         * than as a failed upload.
         */
        if (caught instanceof ApiError && caught.code === 'INTEGRATION_NOT_CONFIGURED') {
          setError('Document uploads are not available right now. Please check back shortly.')
        }
        setDocuments([])
      }
    },
    [enrollmentId],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function onSelect(type: DocumentKind, file: File | undefined) {
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploadingType(type)

    try {
      await uploadDocument({ file, enrollmentId, type })
      // Re-fetch rather than appending locally: the list needs fresh signed
      // download urls, which only the server can mint.
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That upload failed. Please try again.')
    } finally {
      setUploadingType(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold text-ink">Documents</h4>
        {documents !== null && (
          <span className="text-xs text-subtle">
            {documents.filter((document) => document.status === 'approved').length} of{' '}
            {REQUIRED.length} approved
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <FormError>{error}</FormError>
        </div>
      )}

      <ul className="mt-4 space-y-2.5">
        {REQUIRED.map((requirement) => {
          // Most recent submission of this type wins; the list arrives newest-first.
          const existing = documents?.find((document) => document.type === requirement.type)
          const busy = uploadingType === requirement.type

          return (
            <li
              key={requirement.type}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{requirement.label}</p>
                {existing ? (
                  <p className="mt-0.5 truncate text-xs text-subtle">
                    {existing.originalFilename} · {formatFileSize(existing.sizeBytes)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-subtle">{requirement.help}</p>
                )}
                {existing?.status === 'rejected' && existing.reviewNote && (
                  <p className="mt-1.5 text-xs font-medium text-critical">{existing.reviewNote}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                {existing && <DocumentStatusBadge status={existing.status} />}

                {existing && (
                  <a
                    href={existing.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent underline-offset-4 hover:underline"
                  >
                    View
                  </a>
                )}

                {/*
                  Re-upload stays available after a rejection, which is the whole
                  point of showing the reviewer's note.
                */}
                {existing?.status !== 'approved' && (
                  <FilePicker
                    id={`upload-${enrollmentId}-${requirement.type}`}
                    busy={busy}
                    label={existing ? 'Replace' : 'Upload'}
                    onSelect={(file) => void onSelect(requirement.type, file)}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-xs text-subtle">PDF, JPG, or PNG · 15MB maximum</p>
    </div>
  )
}

/**
 * Hidden native input driven by a styled button.
 *
 * A label-wrapped input would be simpler, but the value must be cleared after
 * each pick so choosing the same filename twice still fires a change event.
 */
function FilePicker({
  id,
  label,
  busy,
  onSelect,
}: {
  id: string
  label: string
  busy: boolean
  onSelect: (file: File | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={(event) => {
          onSelect(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? <Spinner size={14} label="Uploading" /> : label}
      </Button>
    </>
  )
}
