import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { applyJsonTransform, publishableFields } from './plugins';

/**
 * Community submissions.
 *
 * Consent is stored as four separate booleans rather than one flag, because the
 * guide requires permission before anything is featured and a single blanket
 * tick is not meaningful permission for material this personal. Publishing is
 * blocked unless `consent.publishStory` is true — enforced in the service layer,
 * not just the UI.
 */
const consentSchema = new Schema(
  {
    publishStory: { type: Boolean, default: false },
    publishName: { type: Boolean, default: false },
    publishImagery: { type: Boolean, default: false },
    contactForFollowUp: { type: Boolean, default: false },
    agreedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const storySchema = new Schema(
  {
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    quote: { type: String, default: '' },
    fullStory: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
    /** Never exposed by public endpoints. */
    authorEmail: { type: String, required: true, lowercase: true, trim: true, select: false },
    authorLocation: { type: String, default: '' },
    transformationArc: { type: String, required: true },
    videoUrl: String,
    photo: {
      type: new Schema(
        { url: String, alt: { type: String, default: '' } },
        { _id: false }
      ),
      default: undefined,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    consent: { type: consentSchema, required: true },
    moderation: {
      state: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'needs-changes'],
        default: 'pending',
        index: true,
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      notes: String,
    },
    ...publishableFields,
  },
  { timestamps: true }
);

applyJsonTransform(storySchema);
export type CommunityStoryDoc = HydratedDocument<InferSchemaType<typeof storySchema>>;
export const CommunityStory = model('CommunityStory', storySchema);

/* Volunteer and mentorship applications */
const applicationSchema = new Schema(
  {
    kind: { type: String, enum: ['volunteer', 'mentorship'], required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    interests: { type: [String], default: [] },
    availability: String,
    message: String,
    state: {
      type: String,
      enum: ['new', 'contacted', 'accepted', 'declined'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);
applyJsonTransform(applicationSchema);
export type CommunityApplicationDoc = HydratedDocument<InferSchemaType<typeof applicationSchema>>;
export const CommunityApplication = model('CommunityApplication', applicationSchema);

/* Podcast guest nominations */
const nominationSchema = new Schema(
  {
    nomineeName: { type: String, required: true },
    nomineeStory: { type: String, required: true },
    nominatorName: { type: String, required: true },
    nominatorEmail: { type: String, required: true, lowercase: true, trim: true },
    relationship: String,
    contactInfo: String,
    state: { type: String, enum: ['new', 'reviewing', 'booked', 'declined'], default: 'new', index: true },
  },
  { timestamps: true }
);
applyJsonTransform(nominationSchema);
export type GuestNominationDoc = HydratedDocument<InferSchemaType<typeof nominationSchema>>;
export const GuestNomination = model('GuestNomination', nominationSchema);
