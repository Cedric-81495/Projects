// server/src/models/Document.ts  (NEW FILE)

import { Schema, model, Document as MongooseDocument, Types } from 'mongoose';

export type DocumentType = 'id' | 'credit_report' | 'business_doc';
export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected';

export interface EnrollmentDocumentDoc extends MongooseDocument {
  _id: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  userId: Types.ObjectId;
  type: DocumentType;
  s3Key: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentReviewStatus;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  createdAt: Date;
}

const documentSchema = new Schema<EnrollmentDocumentDoc>({
  enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['id', 'credit_report', 'business_doc'], required: true },
  s3Key: { type: String, required: true, unique: true },
  originalFilename: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Named EnrollmentDocument (not "Document") to avoid clashing with the
// global DOM Document type, and to make its purpose explicit alongside
// Enrollment / Payment.
export const EnrollmentDocument = model<EnrollmentDocumentDoc>('EnrollmentDocument', documentSchema);
