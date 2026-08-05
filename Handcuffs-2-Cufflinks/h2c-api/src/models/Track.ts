import { Schema, model, InferSchemaType } from 'mongoose';

const trackSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    length: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Track = InferSchemaType<typeof trackSchema>;
export const TrackModel = model('Track', trackSchema);
