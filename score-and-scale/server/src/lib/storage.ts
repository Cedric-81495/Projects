import crypto from 'node:crypto'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readOptional, readOptionalGroup } from './env'
import { integrationUnavailable } from './errors'

/**
 * Supabase Storage rather than S3.
 *
 * File bytes never pass through this server: the client asks for a short-lived
 * signed upload token, sends the file straight to Supabase, then calls back to
 * confirm. That keeps Render's request memory flat regardless of file size and
 * removes a whole class of upload-proxy failures.
 */

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

const DOWNLOAD_URL_TTL_SECONDS = 15 * 60

let client: SupabaseClient | null = null
let bucket: string | null = null

/** Bucket name, with a default so only the credentials are truly required. */
const DEFAULT_BUCKET = 'documents'

function getClient(): { client: SupabaseClient; bucket: string } {
  if (client && bucket) return { client, bucket }

  const config = readOptionalGroup(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const)

  if (!config) throw integrationUnavailable('Supabase Storage')

  // The service_role key bypasses Row Level Security, so it is confined to
  // this module and must never be sent to the browser.
  client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  bucket = readOptional('SUPABASE_STORAGE_BUCKET', DEFAULT_BUCKET) as string

  return { client, bucket }
}

export function isStorageConfigured(): boolean {
  return readOptionalGroup(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const) !== null
}

/**
 * Builds the object path.
 *
 * The original filename is never used in the key: it is attacker-controlled and
 * could contain traversal sequences or unicode that confuses the storage layer.
 * Only the extension is carried over, and only from a fixed allowlist.
 */
export function buildDocumentKey(input: {
  userId: string
  enrollmentId: string
  type: string
  originalFilename: string
}): string {
  const extension = path.extname(input.originalFilename).toLowerCase()
  const safeExtension = ['.pdf', '.jpg', '.jpeg', '.png'].includes(extension) ? extension : ''
  const unique = crypto.randomBytes(12).toString('hex')

  return `${input.userId}/${input.enrollmentId}/${input.type}-${Date.now()}-${unique}${safeExtension}`
}

/**
 * Issues a signed upload token. The client uploads with supabase-js's
 * uploadToSignedUrl(), which is scoped to exactly this one object path.
 */
export async function createUploadToken(storageKey: string): Promise<string> {
  const { client: supabase, bucket: bucketName } = getClient()

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(storageKey)

  if (error || !data) {
    throw new Error(`Could not create upload token: ${error?.message ?? 'unknown error'}`)
  }

  return data.token
}

/** Time-limited GET url, so document links cannot be shared indefinitely. */
export async function createDownloadUrl(storageKey: string): Promise<string> {
  const { client: supabase, bucket: bucketName } = getClient()

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storageKey, DOWNLOAD_URL_TTL_SECONDS)

  if (error || !data) {
    throw new Error(`Could not create download url: ${error?.message ?? 'unknown error'}`)
  }

  return data.signedUrl
}

/**
 * Verifies an object really exists at the given path and reports its size.
 * Called when confirming an upload so the database cannot record a document
 * the client never actually sent, or lie about how large it was.
 */
export async function statObject(
  storageKey: string,
): Promise<{ exists: boolean; sizeBytes: number }> {
  const { client: supabase, bucket: bucketName } = getClient()

  const directory = path.posix.dirname(storageKey)
  const filename = path.posix.basename(storageKey)

  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(directory, { search: filename, limit: 1 })

  if (error) throw new Error(`Could not stat object: ${error.message}`)

  const entry = data?.find((item) => item.name === filename)
  if (!entry) return { exists: false, sizeBytes: 0 }

  const size = (entry.metadata as { size?: number } | null)?.size ?? 0
  return { exists: true, sizeBytes: size }
}

export async function removeObject(storageKey: string): Promise<void> {
  const { client: supabase, bucket: bucketName } = getClient()
  await supabase.storage.from(bucketName).remove([storageKey])
}
