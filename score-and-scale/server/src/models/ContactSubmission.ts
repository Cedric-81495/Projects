import { Schema, model, Document, Types } from 'mongoose';

export interface ContactSubmissionDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'responded';
  createdAt: Date;
}

const contactSchema = new Schema<ContactSubmissionDoc>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'read', 'responded'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
});

export const ContactSubmission = model<ContactSubmissionDoc>('ContactSubmission', contactSchema);
