import { Schema, model, InferSchemaType } from 'mongoose';

const communityStorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    story: { type: String, required: true, trim: true },
    // Moderated before it can ever appear publicly.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

export type CommunityStory = InferSchemaType<typeof communityStorySchema>;
export const CommunityStoryModel = model('CommunityStory', communityStorySchema);
