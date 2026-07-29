import { Schema, model, type InferSchemaType } from 'mongoose'

export const PAYMENT_STATUSES = ['succeeded', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/**
 * A single Braintree transaction.
 *
 * There is deliberately no userId: a payment is always reached through its
 * enrollment, which keeps one owner of that relationship. Reads that need a
 * customer resolve the user's enrollments first, then query by those ids.
 *
 * `braintreeTransactionId` is unique, which makes the write idempotent — a
 * retried webhook or double-submitted form cannot record the same charge twice.
 */
const paymentSchema = new Schema(
  {
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    braintreeTransactionId: { type: String, required: true, unique: true, index: true },
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    status: { type: String, enum: PAYMENT_STATUSES, required: true, index: true },
    cardBrand: { type: String, default: '' },
    cardLast4: { type: String, default: '' },
    failureReason: { type: String, default: '' },
  },
  { timestamps: true },
)

export type PaymentType = InferSchemaType<typeof paymentSchema>
export const Payment = model<PaymentType>('Payment', paymentSchema)
