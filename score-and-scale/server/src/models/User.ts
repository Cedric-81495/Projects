import bcrypt from 'bcrypt'
import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose'
import { REFRESH_TTL_MS } from '../lib/jwt'

const BCRYPT_ROUNDS = 12

/**
 * One entry per active refresh-token lineage, so a user can be signed in on
 * several devices independently.
 *
 * `tokenHash` stores a SHA-256 digest rather than the token itself: a database
 * dump then yields nothing replayable. `sid` identifies the rotation family —
 * when a token is presented that has already been rotated, the whole family is
 * revoked, since that pattern means a stolen token is in circulation.
 */
const refreshSessionSchema = new Schema(
  {
    sid: { type: String, required: true },
    tokenHash: { type: String, required: true, index: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + REFRESH_TTL_MS),
    },
  },
  { _id: false },
)

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    /**
     * Absent for accounts created through Google OAuth. Selected out of
     * queries by default so a stray `.find()` cannot leak hashes into a
     * response body.
     */
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    googleId: { type: String, default: null, index: true, sparse: true },
    avatarUrl: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    refreshSessions: { type: [refreshSessionSchema], default: [], select: false },
  },
  { timestamps: true },
)

userSchema.methods.verifyPassword = async function verifyPassword(
  this: HydratedDocument<UserType>,
  candidate: string,
): Promise<boolean> {
  if (!this.passwordHash) return false
  return bcrypt.compare(candidate, this.passwordHash)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export type UserType = InferSchemaType<typeof userSchema>
export type UserDocument = HydratedDocument<UserType> & {
  verifyPassword(candidate: string): Promise<boolean>
}

export const User = model<UserType>('User', userSchema)
