import type { Schema } from 'mongoose';

/**
 * Shared schema behaviour.
 *
 * Every document is exposed to the client as `id`, never `_id` or `__v`. The
 * frontend types declare `id: string`, so normalising here means no controller
 * has to remember to map it.
 */
export function applyJsonTransform(schema: Schema): void {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      // Defence in depth: these must never be serialised even if a query
      // forgets to exclude them. select:false on the schema is the first line;
      // the case this catches is a legitimate `.select('+mfaSecret')` whose
      // document then gets handed to a response further down the call.
      delete ret.passwordHash;
      delete ret.tokenHash;
      delete ret.mfaSecret;
      delete ret.mfaRecoveryCodes;
      delete ret.mfaTicketHash;
      delete ret.verificationToken;
      delete ret.passwordResetToken;
      return ret;
    },
  });
  schema.set('toObject', { virtuals: true, versionKey: false });
}

/** Fields shared by every publishable content type. */
export const publishableFields = {
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishedAt: { type: Date, default: null },
  scheduledFor: { type: Date, default: null },
} as const;
