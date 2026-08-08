import crypto from 'node:crypto';
import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform } from './plugins';

/**
 * Community members — the public.
 *
 * A separate collection from User, not a third role on it. Staff and the public
 * then share no code path that could confuse one for the other: there is no
 * field a member could acquire that turns them into an administrator, because
 * administrators do not live here. Given that self-registration is open to
 * anyone, that separation is the point.
 *
 * Members carry no permissions at all. Their account exists so their
 * engagement, saved pieces, and submissions follow them between devices.
 */
const memberSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
    },
    // select:false so a stray find() cannot leak hashes into a response.
    passwordHash: { type: String, required: true, select: false },

    location: { type: String, trim: true, maxlength: 160 },

    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    verificationExpires: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    isActive: { type: Boolean, default: true, index: true },
    /** Bumped to invalidate every token already issued to this member. */
    tokenVersion: { type: Number, default: 0 },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },

    /**
     * Whether they also asked for the mailing list. Kept as a separate consent
     * from the account itself — creating an account is not agreeing to be
     * emailed marketing.
     */
    subscribedToMovement: { type: Boolean, default: false },
  },
  { timestamps: true }
);

memberSchema.methods.issueVerificationToken = function issueVerificationToken(this: MemberDoc): string {
  const raw = crypto.randomBytes(32).toString('base64url');
  this.verificationToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return raw;
};

applyJsonTransform(memberSchema);
export type MemberDoc = HydratedDocument<InferSchemaType<typeof memberSchema>>;
export const Member = model('Member', memberSchema);
