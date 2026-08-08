import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform } from './plugins';

/**
 * Digital asset library, organised by brand so Handcuffs 2 Cufflinks, GWOP, and
 * Kitchen Muzik material stays separable — the three brands share an ecosystem
 * but not a visual identity.
 *
 * Two sources are supported, and the distinction is recorded rather than
 * inferred:
 *
 *   `external` — the asset is hosted somewhere else (YouTube, a CDN, the
 *     photographer's delivery) and the library holds a reference to it. This is
 *     what the CMS can offer today: cataloguing, alt text, brand grouping, and
 *     reuse across records, with no storage backend to choose first.
 *
 *   `upload`   — bytes this platform received and stored. Reserved for when the
 *     storage adapter lands; `storageKey` is the handle the adapter will use to
 *     delete or re-sign the object.
 *
 * Recording it means the eventual migration can find every asset that still
 * points at somebody else's server, instead of guessing from the URL.
 */
const mediaSchema = new Schema(
  {
    kind: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true, index: true },
    url: { type: String, required: true },
    source: { type: String, enum: ['external', 'upload'], default: 'external', index: true },
    /** Stored filename, always server-generated — never the uploader's. */
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true, default: 'application/octet-stream' },
    /** Unknown for external references; only an upload can be measured. */
    sizeBytes: { type: Number, required: true, default: 0 },
    alt: { type: String, default: '' },
    caption: String,
    width: Number,
    height: Number,
    durationSeconds: Number,
    brand: { type: String, enum: ['h2c', 'gwop', 'kitchen'], default: 'h2c', index: true },
    tags: { type: [String], default: [], index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /**
     * Soft delete, for the same reason content is archived rather than dropped:
     * an asset removed from the library may still be referenced by a published
     * record, and a hard delete would turn that into a broken image on the live
     * site with no way back.
     */
    archivedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

applyJsonTransform(mediaSchema);
export type MediaAssetDoc = HydratedDocument<InferSchemaType<typeof mediaSchema>>;
export const MediaAsset = model('MediaAsset', mediaSchema);
