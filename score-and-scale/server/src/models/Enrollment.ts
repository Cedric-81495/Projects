import { Schema, model, Document, Types } from 'mongoose';

export type EnrollmentStatus = 'pending_payment' | 'active' | 'in_review' | 'funded' | 'cancelled';

interface HistoryEntry {
  status: EnrollmentStatus;
  changedAt: Date;
  changedBy?: Types.ObjectId; // admin who made the change, if manual
}

export interface EnrollmentDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  programId: Types.ObjectId;
  status: EnrollmentStatus;
  braintreeTransactionId?: string;
  history: HistoryEntry[];
  createdAt: Date;
}

const enrollmentSchema = new Schema<EnrollmentDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  status: {
    type: String,
    enum: ['pending_payment', 'active', 'in_review', 'funded', 'cancelled'],
    default: 'pending_payment',
  },
  braintreeTransactionId: { type: String },
  history: [
    {
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const Enrollment = model<EnrollmentDoc>('Enrollment', enrollmentSchema);
