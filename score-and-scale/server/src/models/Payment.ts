import { Schema, model, Document, Types } from 'mongoose';

export interface PaymentDoc extends Document {
  _id: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  stripePaymentIntentId: string;
  amountCents: number;
  status: 'succeeded' | 'failed' | 'refunded';
  createdAt: Date;
}

const paymentSchema = new Schema<PaymentDoc>({
  enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
  stripePaymentIntentId: { type: String, required: true, unique: true },
  amountCents: { type: Number, required: true },
  status: { type: String, enum: ['succeeded', 'failed', 'refunded'], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Payment = model<PaymentDoc>('Payment', paymentSchema);
