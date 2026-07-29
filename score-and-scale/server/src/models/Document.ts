import { Schema, model, type InferSchemaType } from 'mongoose'

export const DOCUMENT_TYPES = ['id', 'credit_report', 'business_doc'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id: 'Photo ID',
  credit_report: 'Credit Report',
  business_doc: 'Business Document',
}

const documentSchema = new Schema(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    /**
     * Denormalised from the enrollment so ownership can be checked with a
     * single indexed lookup on every download, rather than a join.
     */
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    /**
     * Object path inside the Supabase Storage bucket. The field keeps its
     * historic `storageKey` naming intent but is provider-agnostic: it held an
     * S3 key before the move to Supabase and the format is opaque to callers.
     */
    storageKey: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '' },
  },
  { timestamps: true },
)

/** Admin review queue reads pending documents oldest-first. */
documentSchema.index({ status: 1, createdAt: -1 })

export type EnrollmentDocumentType = InferSchemaType<typeof documentSchema>
export const EnrollmentDocument = model<EnrollmentDocumentType>(
  'EnrollmentDocument',
  documentSchema,
)
