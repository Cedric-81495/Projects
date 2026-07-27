// server/src/lib/storage.ts  (NEW FILE)

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Required env vars (server/.env):
//   AWS_ACCESS_KEY_ID=...
//   AWS_SECRET_ACCESS_KEY=...
//   AWS_REGION=...
//   S3_BUCKET_NAME=...
const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const BUCKET = process.env.S3_BUCKET_NAME!;

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function buildDocumentKey(userId: string, enrollmentId: string, originalFilename: string) {
  const ext = originalFilename.split('.').pop()?.toLowerCase() ?? 'bin';
  return `documents/${userId}/${enrollmentId}/${randomUUID()}.${ext}`;
}

// Presigned PUT — the browser uploads the file bytes directly to S3; our
// server never receives or buffers the raw file. Expiry is short since
// it's used immediately after being issued.
export async function getUploadUrl(key: string, mimeType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}

// Presigned GET — used whenever a user or admin needs to view/download a
// document. Never return a permanent public URL for anything in this bucket.
export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes
}
