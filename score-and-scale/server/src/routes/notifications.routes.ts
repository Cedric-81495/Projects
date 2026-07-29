import { Router } from 'express'
import { z } from 'zod'
import { notFound } from '../lib/errors'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/requireAuth'
import { objectId, validate } from '../middleware/validate'
import { Notification } from '../models/Notification'

const router = Router()

router.use(requireAuth)

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ userId: req.user!.id, readAt: null }),
    ])

    res.json({
      code: 'OK',
      unreadCount,
      notifications: notifications.map((notification) => ({
        id: String(notification._id),
        type: notification.type,
        title: notification.title,
        body: notification.body,
        href: notification.href,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })),
    })
  }),
)

// ---------------------------------------------------------------------------
// PATCH /api/notifications/:id/read
// ---------------------------------------------------------------------------
router.patch(
  '/:id/read',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    /**
     * userId is part of the filter rather than checked afterwards, so one
     * customer can never mark another's notification as read.
     */
    const result = await Notification.updateOne(
      { _id: req.params.id, userId: req.user!.id, readAt: null },
      { $set: { readAt: new Date() } },
    )

    if (result.matchedCount === 0) {
      throw notFound('NOTIFICATION_NOT_FOUND', 'That notification does not exist.')
    }

    res.json({ code: 'NOTIFICATION_READ' })
  }),
)

// ---------------------------------------------------------------------------
// PATCH /api/notifications/read-all
// ---------------------------------------------------------------------------
router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user!.id, readAt: null },
      { $set: { readAt: new Date() } },
    )
    res.json({ code: 'NOTIFICATIONS_READ' })
  }),
)

export default router
