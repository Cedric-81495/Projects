import { Schema, model } from 'mongoose';
import type { Document, Model, Types } from 'mongoose';
import { ROLES } from '@/types/auth';
import type { Role } from '@/types/auth';
import { applyJsonTransform } from './plugins';

export interface UserDoc extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  /** Absent for Google-only accounts. */
  passwordHash?: string;
  role: Role;
  emailVerified: boolean;
  mfaEnabled: boolean;
  isActive: boolean;
  googleId?: string;
  avatarUrl?: string;
  lastLoginAt: Date | null;
  /** Bumped to invalidate every issued access token for this user. */
  tokenVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      // Enforced at the schema level as well as in the request validators, so
      // no path — including scripts and seeds — can create an unreachable account.
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },
    // select:false so a stray `User.find()` cannot leak hashes into a response.
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'admin', index: true },
    emailVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

applyJsonTransform(userSchema);

export const User: Model<UserDoc> = model<UserDoc>('User', userSchema);
