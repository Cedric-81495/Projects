import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform } from './plugins';

/**
 * Digital asset library, organised by brand so Handcuffs 2 Cufflinks, GWOP, and
 * Kitchen Muzik material stays separable — the three brands share an ecosystem
 * but not a visual identity.
 */
const mediaSchema = new Schema(
  {
    kind: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true, index: true },
    url: { type: String, required: true },
    /** Stored filename, always server-generated — never the uploader's. */
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    alt: { type: String, default: '' },
    caption: String,
    width: Number,
    height: Number,
    durationSeconds: Number,
    brand: { type: String, enum: ['h2c', 'gwop', 'kitchen'], default: 'h2c', index: true },
    tags: { type: [String], default: [], index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

applyJsonTransform(mediaSchema);
export type MediaAssetDoc = HydratedDocument<InferSchemaType<typeof mediaSchema>>;
export const MediaAsset = model('MediaAsset', mediaSchema);
