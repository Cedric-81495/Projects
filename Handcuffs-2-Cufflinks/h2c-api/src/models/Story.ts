import { Schema, model, InferSchemaType } from 'mongoose';

// Mirrors the frontend Story type (src/data/content.ts).
const storySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    guest: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    blurb: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type Story = InferSchemaType<typeof storySchema>;
export const StoryModel = model('Story', storySchema);
