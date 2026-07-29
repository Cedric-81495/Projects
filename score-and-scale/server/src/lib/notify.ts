import { Types } from 'mongoose'
import { Notification, type NotificationType } from '../models/Notification'
import { logger } from './logger'

/**
 * Creates an in-app notification. Like the audit trail this never throws — a
 * notification is a courtesy attached to an action that has already succeeded,
 * so a failure here must not roll the action back.
 */
export async function notifyUser(input: {
  userId: Types.ObjectId | string
  type: NotificationType
  title: string
  body?: string
  href?: string
}): Promise<void> {
  try {
    await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      href: input.href ?? '',
    })
  } catch (error) {
    logger.error('Failed to create notification', {
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
