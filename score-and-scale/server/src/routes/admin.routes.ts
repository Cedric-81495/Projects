import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'
import { objectId, paginationSchema, validate } from '../middleware/validate'
import { AuditLog } from '../models/AuditLog'
import { ContactSubmission, CONTACT_STATUSES } from '../models/ContactSubmission'
import { Enrollment } from '../models/Enrollment'
import { Payment } from '../models/Payment'
import { User } from '../models/User'
import { notFound } from '../lib/errors'
import { recordAudit } from '../lib/audit'

const router = Router()

/**
 * Every route below is gated at the router level rather than per-handler.
 * A new endpoint added to this file is therefore protected by default — the
 * failure mode of forgetting the middleware is a locked door, not an open one.
 */
router.use(requireAuth, requireAdmin)

// ---------------------------------------------------------------------------
// GET /api/admin/kpis — overview cards
// ---------------------------------------------------------------------------
router.get(
  '/kpis',
  asyncHandler(async (_req, res) => {
    const startOfMonth = new Date()
    startOfMonth.setUTCDate(1)
    startOfMonth.setUTCHours(0, 0, 0, 0)

    // Independent aggregates, so they run concurrently rather than in series.
    const [totalEnrollments, activeEnrollments, newContacts, revenue, monthlyTrend] =
      await Promise.all([
        Enrollment.countDocuments({}),
        Enrollment.countDocuments({ status: { $in: ['active', 'in_review', 'funded'] } }),
        ContactSubmission.countDocuments({ status: 'new' }),
        Payment.aggregate<{ total: number }>([
          { $match: { status: 'succeeded', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amountCents' } } },
        ]),
        /** Six-month revenue series that powers the admin chart. */
        Payment.aggregate<{ _id: { year: number; month: number }; total: number }>([
          {
            $match: {
              status: 'succeeded',
              createdAt: { $gte: new Date(Date.now() - 183 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              total: { $sum: '$amountCents' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ])

    res.json({
      code: 'OK',
      kpis: {
        totalEnrollments,
        activeEnrollments,
        newContacts,
        revenueThisMonthCents: revenue[0]?.total ?? 0,
      },
      revenueTrend: monthlyTrend.map((bucket) => ({
        label: `${bucket._id.year}-${String(bucket._id.month).padStart(2, '0')}`,
        amountCents: bucket.total,
      })),
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/admin/enrollments — every enrollment
// ---------------------------------------------------------------------------
router.get(
  '/enrollments',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }

    const [enrollments, total] = await Promise.all([
      Enrollment.find()
        .populate('userId', 'name email')
        .populate('programId', 'name slug priceCents')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments({}),
    ])

    res.json({
      code: 'OK',
      total,
      page,
      limit,
      enrollments: enrollments.map((enrollment) => {
        const customer = enrollment.userId as { name?: string; email?: string } | null | undefined
        const program = enrollment.programId as { name?: string } | null | undefined

        return {
          id: String(enrollment._id),
          customerName: customer?.name ?? '',
          customerEmail: customer?.email ?? '',
          programName: program?.name ?? '',
          status: enrollment.status,
          createdAt: enrollment.createdAt,
          updatedAt: enrollment.updatedAt,
        }
      }),
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/admin/contacts — inbox
// ---------------------------------------------------------------------------
router.get(
  '/contacts',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }

    const [submissions, total] = await Promise.all([
      ContactSubmission.find()
        // ip and userAgent are retained for abuse investigation but never
        // returned to the browser.
        .select('name email phone topic message status createdAt')
        .sort({ status: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactSubmission.countDocuments({}),
    ])

    res.json({
      code: 'OK',
      total,
      page,
      limit,
      submissions: submissions.map((submission) => ({
        id: String(submission._id),
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        topic: submission.topic,
        message: submission.message,
        status: submission.status,
        createdAt: submission.createdAt,
      })),
    })
  }),
)

// ---------------------------------------------------------------------------
// PATCH /api/admin/contacts/:id — triage
// ---------------------------------------------------------------------------
router.patch(
  '/contacts/:id',
  validate(z.object({ id: objectId }), 'params'),
  validate(z.object({ status: z.enum(CONTACT_STATUSES) })),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: (typeof CONTACT_STATUSES)[number] }

    const submission = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true },
    )
      .select('_id status')
      .lean()

    if (!submission) throw notFound('CONTACT_NOT_FOUND', 'That submission does not exist.')

    await recordAudit(req, {
      action: 'contact.status_changed',
      entityType: 'ContactSubmission',
      entityId: String(submission._id),
      metadata: { to: status },
    })

    res.json({ code: 'CONTACT_UPDATED', status: submission.status })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/admin/payments — every payment across all customers
// ---------------------------------------------------------------------------
router.get(
  '/payments',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }

    const [payments, total] = await Promise.all([
      Payment.find()
        /**
         * Payment stores only enrollmentId, so the customer email and program
         * name are reached through a nested populate rather than being
         * denormalised onto the payment.
         */
        .populate({
          path: 'enrollmentId',
          select: 'userId programId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'programId', select: 'name' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Payment.countDocuments({}),
    ])

    res.json({
      code: 'OK',
      total,
      page,
      limit,
      payments: payments.map((payment) => {
        const enrollment = payment.enrollmentId as
          | { userId?: { name?: string; email?: string }; programId?: { name?: string } }
          | null
          | undefined

        return {
          id: String(payment._id),
          customerName: enrollment?.userId?.name ?? '',
          customerEmail: enrollment?.userId?.email ?? '',
          programName: enrollment?.programId?.name ?? '',
          amountCents: payment.amountCents,
          currency: payment.currency,
          status: payment.status,
          cardBrand: payment.cardBrand,
          cardLast4: payment.cardLast4,
          transactionId: payment.braintreeTransactionId,
          createdAt: payment.createdAt,
        }
      }),
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/admin/audit-log
// ---------------------------------------------------------------------------
router.get(
  '/audit-log',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }

    const [entries, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({}),
    ])

    res.json({
      code: 'OK',
      total,
      page,
      limit,
      entries: entries.map((entry) => ({
        id: String(entry._id),
        actorEmail: entry.actorEmail,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      })),
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/admin/customers
// ---------------------------------------------------------------------------
router.get(
  '/customers',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }

    const [users, total] = await Promise.all([
      User.find()
        // passwordHash and refreshSessions are select:false and stay excluded.
        .select('name email role createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments({}),
    ])

    res.json({
      code: 'OK',
      total,
      page,
      limit,
      customers: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
    })
  }),
)

export default router
