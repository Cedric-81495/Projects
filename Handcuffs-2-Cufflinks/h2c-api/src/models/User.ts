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
  /** SHA-256 of the emailed token. The raw value only ever exists in the link. */
  verificationToken?: string;
  verificationExpires?: Date | null;
  passwordResetToken?: string;
  passwordResetExpires?: Date | null;
  mfaEnabled: boolean;
  /** Base32 TOTP secret. Written at enrolment, before mfaEnabled flips true. */
  mfaSecret?: string;
  mfaEnrolledAt?: Date | null;
  /** SHA-256 of the live sign-in ticket's id. Cleared when the ticket is spent. */
  mfaTicketHash?: string;
  mfaTicketExpires?: Date | null;
  /** SHA-256 of each unused recovery code. Entries are removed as spent. */
  mfaRecoveryCodes?: string[];
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

    /**
     * Every credential-adjacent field is select:false. These are bearer secrets
     * in their own right — a valid reset token is a password, and a TOTP secret
     * generates every future code — so the default projection must not carry
     * them, and no route may serialise them by accident.
     */
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false, default: null },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false, default: null },

    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaEnrolledAt: { type: Date, default: null },
    mfaRecoveryCodes: { type: [String], select: false, default: [] },
    mfaTicketHash: { type: String, select: false },
    mfaTicketExpires: { type: Date, select: false, default: null },

    isActive: { type: Boolean, default: true, index: true },
    /**
     * unique as well as sparse. sparse alone constrains nothing, which would
     * let one Google identity be linked to several staff records — and since
     * the callback links on first sign-in, that is a state the code can reach.
     */
    googleId: { type: String, unique: true, sparse: true, index: true },
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
