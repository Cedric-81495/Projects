import { Schema, model, Document, Types } from 'mongoose';

export interface ProgramDoc extends Document {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  priceCents: number;
  billingType: 'one_time' | 'program' | 'engagement';
}

const programSchema = new Schema<ProgramDoc>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  priceCents: { type: Number, required: true },
  billingType: { type: String, enum: ['one_time', 'program', 'engagement'], required: true },
});

export const Program = model<ProgramDoc>('Program', programSchema);
