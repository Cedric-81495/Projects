import { Schema, model, InferSchemaType } from 'mongoose';

const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    source: { type: String, trim: true, default: 'site' },
  },
  { timestamps: true },
);

export type Newsletter = InferSchemaType<typeof newsletterSchema>;
export const NewsletterModel = model('Newsletter', newsletterSchema);
