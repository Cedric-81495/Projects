import { useRef, useState } from 'react';
import { apiPost } from '@/lib/api/client';
import { messageFor } from '../lib/useAsyncData';
import { kindOfFile, uploadToCloudinary } from '../lib/upload';
import type { UploadBrand } from '../lib/upload';

/**
 * Upload panel for the media library.
 *
 * Two steps, in this order, and the order matters: the file goes to Cloudinary
 * first, and only an upload that succeeded is registered here. Registering
 * first would leave a library full of records pointing at files that never
 * arrived, which is worse than an upload that simply failed.
 *
 * Alt text is asked for before the upload rather than after. It is required for
 * images anyway, and asking afterwards is how a library fills up with assets
 * nobody can use accessibly — the person has moved on by then.
 */

const BRANDS: { value: UploadBrand; label: string }[] = [
  { value: 'h2c', label: 'Handcuffs 2 Cufflinks' },
  { value: 'gwop', label: 'GWOP' },
  { value: 'kitchen', label: 'Kitchen Muzik' },
];

interface MediaUploadProps {
  onUploaded: () => void;
}

export function MediaUpload({ onUploaded }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [brand, setBrand] = useState<UploadBrand>('h2c');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kind = file ? kindOfFile(file) : undefined;
  const needsAlt = kind === 'image' && !alt.trim();
  const unknownType = Boolean(file && !kind);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!file || !kind || needsAlt) return;

    setError(null);
    setProgress(0);

    try {
      const uploaded = await uploadToCloudinary(file, kind, brand, setProgress);

      await apiPost('/media', {
        url: uploaded.url,
        kind,
        brand,
        alt: alt.trim(),
        caption: caption.trim() || undefined,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        width: uploaded.width,
        height: uploaded.height,
        durationSeconds: uploaded.durationSeconds,
        tags: [],
      });

      setFile(null);
      setAlt('');
      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
      onUploaded();
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setProgress(null);
    }
  }

  const uploading = progress !== null;

  return (
    <form className="adm-form" onSubmit={(event) => void submit(event)}>
      <div className="adm-field">
        <label htmlFor="mu-file">File</label>
        <input
          id="mu-file"
          ref={inputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          disabled={uploading}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
        />
        <small>
          Images, video, audio and documents. Large video is fine — it goes straight to Cloudinary
          and does not pass through this site.
        </small>
      </div>

      {unknownType && (
        <p className="adm-hint adm-hint--bad">
          That file type is not recognised. Add it by address instead, or convert it first.
        </p>
      )}

      <div className="adm-row">
        <div className="adm-field">
          <label htmlFor="mu-brand">Brand</label>
          <select
            id="mu-brand"
            value={brand}
            disabled={uploading}
            onChange={(event) => setBrand(event.target.value as UploadBrand)}
          >
            {BRANDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="adm-field">
          <label htmlFor="mu-caption">Caption</label>
          <input
            id="mu-caption"
            type="text"
            value={caption}
            disabled={uploading}
            onChange={(event) => setCaption(event.target.value)}
          />
        </div>
      </div>

      <div className="adm-field">
        <label htmlFor="mu-alt">
          Alt text{kind === 'image' ? ' (required)' : ''}
        </label>
        <input
          id="mu-alt"
          type="text"
          value={alt}
          disabled={uploading}
          placeholder="Founder in a tailored charcoal suit, adjusting a gold cufflink"
          onChange={(event) => setAlt(event.target.value)}
        />
        <small>Describe what is in the frame. Do not start with “image of”.</small>
      </div>

      {uploading && (
        <div className="adm-progress" role="status" aria-live="polite">
          <span style={{ transform: `scaleX(${Math.max(progress, 0.02)})` }} />
          <b>{Math.round(progress * 100)}% uploaded</b>
        </div>
      )}

      {error && (
        <p className="adm-hint adm-hint--bad" role="alert">
          {error}
        </p>
      )}

      <div className="adm-save">
        <button
          type="submit"
          className="adm-btn adm-btn--primary"
          disabled={!file || !kind || needsAlt || uploading}
        >
          {uploading ? 'Uploading' : 'Upload and add'}
        </button>
        {needsAlt && file && <span className="adm-hint">Alt text is required for images.</span>}
      </div>
    </form>
  );
}
