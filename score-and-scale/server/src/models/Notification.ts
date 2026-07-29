import { Schema, model, type InferSchemaType } from 'mongoose'

export const NOTIFICATION_TYPES = [
  'enrollment_status',
  'document_reviewed',
  'payment_received',
  'lesson_available',
  'system',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    /** Relative client path the notification deep-links to. */
    href: { type: String, default: '' },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

/** Bell dropdown reads a user's unread notifications newest-first. */
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 })

export type NotificationDocumentType = InferSchemaType<typeof notificationSchema>
export const Notification = model<NotificationDocumentType>('Notification', notificationSchema)
