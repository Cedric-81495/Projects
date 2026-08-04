import { Schema, model, InferSchemaType } from 'mongoose';

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type Member = InferSchemaType<typeof memberSchema>;
export const MemberModel = model('Member', memberSchema);
