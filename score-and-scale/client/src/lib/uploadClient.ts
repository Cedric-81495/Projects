// client/src/lib/uploadClient.ts  (UPDATED — upload step now goes through
// supabase-js instead of a plain PUT)

import { apiFetch } from './api';
import { supabase, DOCUMENTS_BUCKET } from './supabaseClient';

export type DocType = 'id' | 'credit_report' | 'business_doc';

export interface UploadableFile {
  file: File;
  enrollmentId: string;
  type: DocType;
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB — keep in sync with server/src/lib/storage.ts

export function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Only PDF, JPG, or PNG files are accepted.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large — max size is 15MB.';
  }
  return null;
}

// Kept separate from apiFetch on purpose: apiFetch always sets
// Content-Type: application/json, which the login/session flow depends on.
// This helper uses apiFetch for the JSON steps (talking to our own API),
// then uploads the raw file straight to Supabase Storage via a signed
// token — the file bytes never pass through our Express server.
export async function uploadDocument({ file, enrollmentId, type }: UploadableFile) {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const { token, s3Key } = await apiFetch<{ token: string; s3Key: string }>('/api/documents/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      type,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });

  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).uploadToSignedUrl(s3Key, token, file);
  if (error) throw new Error('Upload to storage failed. Please try again.');

  return apiFetch('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      type,
      s3Key,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  });
}

export interface DocRow {
  id: string;
  type: string;
  originalFilename: string;
  status: string;
  reviewNote?: string;
  downloadUrl: string;
}

export async function fetchDocuments(enrollmentId: string) {
  return apiFetch<DocRow[]>(`/api/documents?enrollmentId=${enrollmentId}`);
}
