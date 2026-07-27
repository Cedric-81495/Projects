// server/src/lib/storage.ts  (REPLACES the AWS S3 version — same filename)

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Required env vars (server/.env):
//   SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...   (secret — server only, never send to client)
//   SUPABASE_STORAGE_BUCKET=...
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

// Service role key bypasses Row Level Security entirely — this client must
// only ever be instantiated server-side.
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function buildDocumentKey(userId: string, enrollmentId: string, originalFilename: string) {
  const ext = originalFilename.split('.').pop()?.toLowerCase() ?? 'bin';
  return `documents/${userId}/${enrollmentId}/${randomUUID()}.${ext}`;
}

// Returns a short-lived signed upload token for a given storage path. The
// client uses this with supabase-js's uploadToSignedUrl() — NOT a plain
// fetch PUT — since Supabase's signed-upload flow expects the storage-js
// client to attach the token in its own request format.
export async function getUploadToken(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Failed to create signed upload url: ${error?.message}`);
  return { token: data.token, path: data.path };
}

// Presigned GET — used whenever a user or admin needs to view/download a
// document. The bucket itself stays private; this signed URL is the only
// way in.
export async function getDownloadUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 900); // 15 min
  if (error || !data) throw new Error(`Failed to create signed download url: ${error?.message}`);
  return data.signedUrl;
}
