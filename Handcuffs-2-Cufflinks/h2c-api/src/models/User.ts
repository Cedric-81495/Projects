import { Schema, model, InferSchemaType } from 'mongoose';

/**
 * A member of the movement. Created on first Google sign-in.
 *  - role:   'user' by default; an admin can promote to 'admin' from the dashboard.
 *  - status: 'active' | 'suspended' — suspended users cannot sign in or post.
 *  - tier:   membership tier powering the "premium" profile badge (not a paywall).
 * Auth secrets are never stored here — identity is delegated to Google.
 */
const userSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    tier: { type: String, enum: ['member', 'vip'], default: 'member' },

    // Optional profile the member can edit.
    bio: { type: String, default: '', maxlength: 600 },
    location: { type: String, default: '', maxlength: 120 },
    interests: { type: [String], default: [] },

    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);

/** Shape returned to clients — never leaks internal fields. */
export function toPublicUser(u: {
  _id: unknown;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  status?: string;
  tier?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  createdAt?: Date | null;
  lastLoginAt?: Date | null;
}) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    avatar: u.avatar ?? '',
    role: u.role ?? 'user',
    status: u.status ?? 'active',
    tier: u.tier ?? 'member',
    bio: u.bio ?? '',
    location: u.location ?? '',
    interests: u.interests ?? [],
    memberSince: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}
