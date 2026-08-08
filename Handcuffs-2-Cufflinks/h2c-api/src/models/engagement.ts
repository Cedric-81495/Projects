import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform } from './plugins';

/**
 * Apparel engagement — the signal that decides what gets produced.
 *
 * One row per (visitor, item, action). The compound unique index is the whole
 * point: these counts determine which pieces are manufactured, so a single
 * visitor must not be able to inflate a collection by clicking repeatedly.
 *
 * Visitors are identified by an anonymous id in an httpOnly cookie — no account
 * required, and nothing personal recorded. IP and user agent are deliberately
 * absent: they would add little to deduplication and turn an anonymous vote
 * into something closer to tracking.
 */
const engagementSchema = new Schema(
  {
    visitorId: { type: String, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'ApparelItem', required: true, index: true },
    action: {
      type: String,
      enum: ['like', 'favorite', 'vote', 'notify', 'share', 'view'],
      required: true,
    },
    /** Only for notify-me, where the visitor asks to be told about a release. */
    email: { type: String, lowercase: true, trim: true },
    /**
     * Set once a member signs in, which is what lets their reactions follow
     * them between devices. Null for anonymous visitors, who are still counted.
     * References Member, not User: staff do not react to apparel.
     */
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', default: null, index: true },
  },
  { timestamps: true }
);

engagementSchema.index({ visitorId: 1, itemId: 1, action: 1 }, { unique: true });

applyJsonTransform(engagementSchema);
export type EngagementDoc = HydratedDocument<InferSchemaType<typeof engagementSchema>>;
export const Engagement = model('Engagement', engagementSchema);
