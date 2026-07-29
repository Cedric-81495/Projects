import { Schema, model, type InferSchemaType } from 'mongoose'

export const ENROLLMENT_STATUSES = [
  'pending_payment',
  'active',
  'in_review',
  'funded',
  'cancelled',
] as const

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number]

/** Statuses a customer may cancel from without an administrator. */
export const SELF_CANCELLABLE: readonly EnrollmentStatus[] = ['pending_payment', 'in_review']

const historySchema = new Schema(
  {
    status: { type: String, enum: ENROLLMENT_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { _id: false },
)

const enrollmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: 'pending_payment',
      index: true,
    },
    /**
     * Append-only audit trail. Every transition is recorded with who made it,
     * which is what the admin timeline and compliance review rely on.
     */
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
)

/**
 * One enrollment per user per program. Checkout upserts on this pair, so a
 * double-submitted payment form tops up the same record instead of creating a
 * duplicate enrollment.
 */
enrollmentSchema.index({ userId: 1, programId: 1 }, { unique: true })

export type EnrollmentType = InferSchemaType<typeof enrollmentSchema>
export const Enrollment = model<EnrollmentType>('Enrollment', enrollmentSchema)
