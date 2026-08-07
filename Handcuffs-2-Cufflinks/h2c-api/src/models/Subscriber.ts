import crypto from 'node:crypto';
import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform } from './plugins';

/**
 * Join the Movement subscribers — the platform's North Star metric.
 *
 * Consent is per channel. Someone can take email without agreeing to texts, and
 * the two are stored separately with the timestamp of the agreement, because
 * "when did they consent and to what" is the question that actually gets asked
 * during a compliance review.
 *
 * Every subscriber gets an unsubscribe token at creation so one-click removal
 * needs no login and no lookup by email.
 */
const subscriberSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, trim: true },
    interests: { type: [String], default: [] },

    consentEmail: { type: Boolean, default: true },
    consentSms: { type: Boolean, default: false },
    consentAt: { type: Date, default: Date.now },
    /** Kept for compliance: proof of where and when consent was given. */
    consentSource: { type: String, default: 'website' },

    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed', 'bounced'],
      default: 'subscribed',
      index: true,
    },
    unsubscribedAt: { type: Date, default: null },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(24).toString('base64url'),
    },
  },
  { timestamps: true }
);

applyJsonTransform(subscriberSchema);
export type SubscriberDoc = HydratedDocument<InferSchemaType<typeof subscriberSchema>>;
export const Subscriber = model('Subscriber', subscriberSchema);
