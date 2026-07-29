import { Schema, model, type InferSchemaType } from 'mongoose'

export const CONTACT_STATUSES = ['new', 'read', 'archived'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

const contactSubmissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    topic: { type: String, default: 'general', trim: true },
    message: { type: String, required: true, maxlength: 5000 },
    status: { type: String, enum: CONTACT_STATUSES, default: 'new', index: true },
    /** Retained for abuse investigation, never returned to the browser. */
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true },
)

contactSubmissionSchema.index({ status: 1, createdAt: -1 })

export type ContactSubmissionType = InferSchemaType<typeof contactSubmissionSchema>
export const ContactSubmission = model<ContactSubmissionType>(
  'ContactSubmission',
  contactSubmissionSchema,
)
