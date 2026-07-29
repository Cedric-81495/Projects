import { Router } from 'express'
import { z } from 'zod'
import { recordAudit } from '../lib/audit'
import { badRequest, forbidden, notFound } from '../lib/errors'
import { sendEnrollmentStatusEmail } from '../lib/mailer'
import { notifyUser } from '../lib/notify'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'
import { objectId, validate } from '../middleware/validate'
import {
  ENROLLMENT_STATUSES,
  Enrollment,
  SELF_CANCELLABLE,
  type EnrollmentStatus,
} from '../models/Enrollment'
import { Program } from '../models/Program'
import { User } from '../models/User'

const router = Router()

router.use(requireAuth)

/** Serialises an enrollment with its populated program, for either audience. */
function serialise(enrollment: {
  _id: unknown
  status: string
  createdAt?: Date
  updatedAt?: Date
  history?: { status: string; changedAt?: Date; note?: string }[]
  programId?: unknown
}) {
  const program = enrollment.programId as
    | { _id: unknown; name?: string; slug?: string; priceCents?: number }
    | null
    | undefined

  return {
    id: String(enrollment._id),
    status: enrollment.status,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    program: program?.name
      ? {
          id: String(program._id),
          name: program.name,
          slug: program.slug,
          priceCents: program.priceCents,
        }
      : null,
    history: (enrollment.history ?? []).map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt,
      note: entry.note ?? '',
    })),
  }
}

// ---------------------------------------------------------------------------
// GET /api/enrollments — the caller's own enrollments
// ---------------------------------------------------------------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const enrollments = await Enrollment.find({ userId: req.user!.id })
      .populate('programId', 'name slug priceCents')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ code: 'OK', enrollments: enrollments.map(serialise) })
  }),
)

// ---------------------------------------------------------------------------
// PATCH /api/enrollments/:id/cancel — self-service cancellation
// ---------------------------------------------------------------------------
router.patch(
  '/:id/cancel',
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id)
    if (!enrollment) throw notFound('ENROLLMENT_NOT_FOUND', 'That enrollment does not exist.')

    /**
     * Ownership is checked before status, and the failure is a 403 rather than a
     * 404-with-detail, so this endpoint cannot be used to probe which
     * enrollment ids exist.
     */
    if (String(enrollment.userId) !== req.user!.id) {
      throw forbidden('FORBIDDEN', 'That enrollment does not belong to you.')
    }

    /**
     * Once an enrollment is active or funded, money and underwriting work are
     * involved, so cancellation becomes an administrator decision rather than a
     * self-service action.
     */
    if (!SELF_CANCELLABLE.includes(enrollment.status as EnrollmentStatus)) {
      throw badRequest(
        'CANCEL_NOT_ALLOWED',
        'This enrollment can no longer be cancelled online. Please contact support.',
      )
    }

    enrollment.status = 'cancelled'
    enrollment.history.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: null,
      note: 'Cancelled by customer',
    })
    await enrollment.save()

    await recordAudit(req, {
      action: 'enrollment.cancelled_by_customer',
      entityType: 'Enrollment',
      entityId: String(enrollment._id),
    })

    res.json({ code: 'ENROLLMENT_CANCELLED', status: enrollment.status })
  }),
)

// ---------------------------------------------------------------------------
// PATCH /api/enrollments/:id/status — administrators only
// ---------------------------------------------------------------------------
router.patch(
  '/:id/status',
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  validate(
    z.object({
      status: z.enum(ENROLLMENT_STATUSES),
      note: z.string().trim().max(500).optional().default(''),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { status, note } = req.body as { status: EnrollmentStatus; note: string }

    const enrollment = await Enrollment.findById(req.params.id)
    if (!enrollment) throw notFound('ENROLLMENT_NOT_FOUND', 'That enrollment does not exist.')

    const previous = enrollment.status

    if (previous === status) {
      res.json({ code: 'ENROLLMENT_UNCHANGED', status })
      return
    }

    enrollment.status = status
    enrollment.history.push({
      status,
      changedAt: new Date(),
      changedBy: req.user!.id as unknown as never,
      note,
    })
    await enrollment.save()

    await recordAudit(req, {
      action: 'enrollment.status_changed',
      entityType: 'Enrollment',
      entityId: String(enrollment._id),
      metadata: { from: previous, to: status, note },
    })

    const [customer, program] = await Promise.all([
      User.findById(enrollment.userId).select('name email').lean(),
      Program.findById(enrollment.programId).select('name').lean(),
    ])

    await notifyUser({
      userId: enrollment.userId,
      type: 'enrollment_status',
      title: `Your enrollment is now ${status.replace(/_/g, ' ')}`,
      body: note,
      href: '/dashboard',
    })

    if (customer?.email) {
      void sendEnrollmentStatusEmail({
        to: customer.email,
        name: customer.name,
        programName: program?.name ?? 'your program',
        status,
      })
    }

    res.json({ code: 'ENROLLMENT_UPDATED', status })
  }),
)

export default router
