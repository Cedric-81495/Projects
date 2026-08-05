import { Schema, model, InferSchemaType } from 'mongoose';

const episodeSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    number: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    guest: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Episode = InferSchemaType<typeof episodeSchema>;
export const EpisodeModel = model('Episode', episodeSchema);
