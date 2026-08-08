import { Schema, model } from 'mongoose';
import type { Document, Model, Types } from 'mongoose';
import { applyJsonTransform } from './plugins';

export interface RefreshTokenDoc extends Document {
  userId: Types.ObjectId;
  subjectType: 'user' | 'member';
  /** SHA-256 of the token. The token itself is never stored. */
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  /** Set when this token is rotated, so reuse of the old one is detectable. */
  replacedByHash: string | null;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    /**
     * Which collection userId points at. Without this a member's refresh token
     * and a staff refresh token are indistinguishable rows, and the refresh
     * endpoint could hand a member a CMS session.
     */
    subjectType: { type: String, enum: ['user', 'member'], default: 'user', index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

/**
 * Mongo removes expired sessions automatically, so the collection cannot grow
 * without bound. Revoked-but-unexpired rows are kept deliberately: they are
 * what makes reuse detection possible.
 */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

applyJsonTransform(refreshTokenSchema);

export const RefreshToken: Model<RefreshTokenDoc> = model<RefreshTokenDoc>(
  'RefreshToken',
  refreshTokenSchema
);
