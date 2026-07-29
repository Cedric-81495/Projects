import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/requireAuth'
import { Enrollment } from '../models/Enrollment'
import { Payment } from '../models/Payment'

const router = Router()

router.use(requireAuth)

/**
 * GET /api/payments — the caller's own payment history.
 *
 * Payment has no userId of its own (an enrollment is the single owner of that
 * relationship), so this resolves the caller's enrollment ids first and then
 * queries payments against that set. Scoping the query this way means a
 * customer can only ever read their own transactions.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const enrollments = await Enrollment.find({ userId: req.user!.id })
      .select('_id programId')
      .populate('programId', 'name slug')
      .lean()

    if (enrollments.length === 0) {
      res.json({ code: 'OK', payments: [] })
      return
    }

    const programByEnrollment = new Map(
      enrollments.map((enrollment) => {
        const program = enrollment.programId as { name?: string } | null | undefined
        return [String(enrollment._id), program?.name ?? 'Program']
      }),
    )

    const payments = await Payment.find({
      enrollmentId: { $in: enrollments.map((enrollment) => enrollment._id) },
    })
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      code: 'OK',
      payments: payments.map((payment) => ({
        id: String(payment._id),
        programName: programByEnrollment.get(String(payment.enrollmentId)) ?? 'Program',
        amountCents: payment.amountCents,
        currency: payment.currency,
        status: payment.status,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        transactionId: payment.braintreeTransactionId,
        createdAt: payment.createdAt,
      })),
    })
  }),
)

export default router
