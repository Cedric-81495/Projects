import { apiFetch } from './api'
import { getStorageBucket, getSupabaseClient } from './supabaseClient'

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

export type DocumentKind = 'id' | 'credit_report' | 'business_doc'

/**
 * Client-side pre-flight validation.
 *
 * Purely a courtesy so the user learns about a bad file immediately instead of
 * after a slow upload. The server re-validates the type, re-reads the real size
 * from storage, and re-checks ownership — nothing here is trusted.
 */
export function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Please upload a PDF, JPG, or PNG file.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'That file is larger than the 15MB limit.'
  }

  if (file.size === 0) {
    return 'That file appears to be empty.'
  }

  return null
}

interface UploadTokenResponse {
  token: string
  storageKey: string
}

export interface UploadedDocument {
  id: string
  type: DocumentKind
  status: 'pending' | 'approved' | 'rejected'
  originalFilename: string
  sizeBytes: number
  createdAt: string
}

/**
 * Three-step upload.
 *
 *   1. Ask our API for a signed upload token, which it issues only after
 *      confirming the enrollment is the caller's.
 *   2. Send the bytes straight to Supabase Storage.
 *   3. Tell our API the upload landed so it can record the document.
 *
 * The file never passes through our Express server, which keeps request memory
 * flat on Render regardless of file size.
 */
export async function uploadDocument(input: {
  file: File
  enrollmentId: string
  type: DocumentKind
}): Promise<UploadedDocument> {
  const validationError = validateFile(input.file)
  if (validationError) throw new Error(validationError)

  const { token, storageKey } = await apiFetch<UploadTokenResponse>('/api/documents/upload-url', {
    method: 'POST',
    body: {
      enrollmentId: input.enrollmentId,
      type: input.type,
      originalFilename: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
    },
  })

  const supabase = getSupabaseClient()
  const { error } = await supabase.storage
    .from(getStorageBucket())
    .uploadToSignedUrl(storageKey, token, input.file, {
      contentType: input.file.type,
    })

  if (error) {
    throw new Error(`We could not upload that file: ${error.message}`)
  }

  const { document } = await apiFetch<{ document: UploadedDocument }>('/api/documents', {
    method: 'POST',
    body: {
      enrollmentId: input.enrollmentId,
      type: input.type,
      storageKey,
      originalFilename: input.file.name,
      mimeType: input.file.type,
    },
  })

  return document
}
