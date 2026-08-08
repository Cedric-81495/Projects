import { apiPost } from '@/lib/api/client';

/**
 * Direct-to-Cloudinary upload from the CMS.
 *
 * The file goes straight from the browser to Cloudinary. The API only signs the
 * request — it never receives the bytes — so a two-gigabyte docuseries master
 * is not limited by the API's request size, does not occupy a web process for
 * the length of the upload, and is not paid for twice in bandwidth.
 *
 * XMLHttpRequest rather than fetch, purely for `upload.onprogress`. A VA
 * uploading a video over a domestic connection needs to see it moving; fetch
 * still cannot report request progress in Safari.
 */

export type UploadKind = 'image' | 'video' | 'audio' | 'document';
export type UploadBrand = 'h2c' | 'gwop' | 'kitchen';

interface Signature {
  cloudName: string;
  apiKey: string;
  resourceType: 'image' | 'video' | 'raw';
  folder: string;
  timestamp: number;
  signature: string;
}

export interface UploadResult {
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

/** Extension groups, mirrored from the API so the picker can label the file. */
const KIND_BY_EXTENSION: Record<string, UploadKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', avif: 'image', gif: 'image', svg: 'image',
  mp4: 'video', mov: 'video', webm: 'video', m4v: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio',
  pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
};

export function kindOfFile(file: File): UploadKind | undefined {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return KIND_BY_EXTENSION[extension];
}

/**
 * Uploads one file and returns what the media library needs to register it.
 *
 * `onProgress` receives 0–1. Cloudinary reports the dimensions and duration it
 * measured, which is better than asking the person to type them and better than
 * guessing from the filename.
 */
export async function uploadToCloudinary(
  file: File,
  kind: UploadKind,
  brand: UploadBrand,
  onProgress?: (fraction: number) => void
): Promise<UploadResult> {
  const signature = await apiPost<Signature>('/media/upload-signature', { kind, brand });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('folder', signature.folder);
  form.append('signature', signature.signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;

  const payload = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', endpoint);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };

    request.onload = () => {
      try {
        const body = JSON.parse(request.responseText) as Record<string, unknown>;
        if (request.status >= 200 && request.status < 300) {
          resolve(body);
          return;
        }
        // Cloudinary's own message is far more useful than a status code —
        // "Invalid Signature" and "File size too large" need different actions.
        const error = body.error as { message?: string } | undefined;
        reject(new Error(error?.message ?? `Upload failed (${request.status}).`));
      } catch {
        reject(new Error(`Upload failed (${request.status}).`));
      }
    };

    request.onerror = () => reject(new Error('The upload could not reach Cloudinary.'));
    request.onabort = () => reject(new Error('Upload cancelled.'));

    request.send(form);
  });

  return {
    url: String(payload.secure_url ?? payload.url ?? ''),
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: typeof payload.bytes === 'number' ? payload.bytes : file.size,
    width: typeof payload.width === 'number' ? payload.width : undefined,
    height: typeof payload.height === 'number' ? payload.height : undefined,
    durationSeconds: typeof payload.duration === 'number' ? payload.duration : undefined,
  };
}
