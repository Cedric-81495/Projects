import { Router } from 'express'
import { z } from 'zod'
import { recordAudit } from '../lib/audit'
import { centsToAmountString, getBraintreeGateway } from '../lib/braintree'
import { badRequest, notFound } from '../lib/errors'
import { logger } from '../lib/logger'
import { notifyUser } from '../lib/notify'
import { asyncHandler } from '../middleware/errorHandler'
import { checkoutLimiter } from '../middleware/rateLimit'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { Enrollment } from '../models/Enrollment'
import { Payment } from '../models/Payment'
import { Program } from '../models/Program'

const router = Router()

router.use(requireAuth)

// ---------------------------------------------------------------------------
// GET /api/checkout/client-token — initialises the Braintree Drop-in UI
// ---------------------------------------------------------------------------
router.get(
  '/client-token',
  asyncHandler(async (_req, res) => {
    const gateway = getBraintreeGateway()
    const { clientToken } = await gateway.clientToken.generate({})
    res.json({ code: 'OK', clientToken })
  }),
)

const chargeSchema = z.object({
  /**
   * Only the program is accepted. The amount is deliberately absent from this
   * schema — see below.
   */
  programSlug: z.string().trim().min(1, 'Missing program'),
  paymentMethodNonce: z.string().min(1, 'Missing payment method'),
  deviceData: z.string().max(4000).optional().default(''),
})

// ---------------------------------------------------------------------------
// POST /api/checkout — charge, then enroll
// ---------------------------------------------------------------------------
router.post(
  '/',
  checkoutLimiter,
  validate(chargeSchema),
  asyncHandler(async (req, res) => {
    const { programSlug, paymentMethodNonce, deviceData } = req.body as z.infer<typeof chargeSchema>

    const program = await Program.findOne({ slug: programSlug, active: true }).lean()
    if (!program) throw notFound('PROGRAM_NOT_FOUND', 'That program is not available.')

    /**
     * The charge amount is derived from Program.priceCents on the server and the
     * client is never consulted. Accepting a client-supplied amount — even one
     * that is validated for shape — would let a modified request pay $1 for a
     * $5,000 program.
     */
    const amountCents = program.priceCents
    if (amountCents <= 0) {
      throw badRequest('PROGRAM_NOT_PURCHASABLE', 'That program cannot be purchased online.')
    }

    const gateway = getBraintreeGateway()
    const sale = await gateway.transaction.sale({
      amount: centsToAmountString(amountCents),
      paymentMethodNonce,
      ...(deviceData ? { deviceData } : {}),
      options: { submitForSettlement: true },
    })

    if (!sale.success || !sale.transaction) {
      logger.warn('Braintree declined a sale', {
        programSlug,
        userId: req.user!.id,
        message: sale.message,
      })
      throw badRequest(
        'PAYMENT_DECLINED',
        sale.message || 'That payment was declined. Please try a different card.',
      )
    }

    const transaction = sale.transaction

    /**
     * The charge has already succeeded at this point, so the enrollment write is
     * the critical follow-up: upserting on (userId, programId) makes a
     * double-submitted form top up the same enrollment instead of creating a
     * duplicate.
     */
    const enrollment = await Enrollment.findOneAndUpdate(
      { userId: req.user!.id, programId: program._id },
      {
        $setOnInsert: {
          userId: req.user!.id,
          programId: program._id,
        },
        $set: { status: 'active' },
        $push: {
          history: {
            status: 'active',
            changedAt: new Date(),
            changedBy: null,
            note: 'Payment received',
          },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    /**
     * The payment record is reporting data, not the source of truth for access.
     * Its own try/catch keeps a bookkeeping failure from turning a completed
     * charge plus a granted enrollment into a 500 the customer would retry.
     */
    try {
      await Payment.create({
        enrollmentId: enrollment._id,
        braintreeTransactionId: transaction.id,
        amountCents,
        currency: program.currency ?? 'USD',
        status: 'succeeded',
        cardBrand: transaction.creditCard?.cardType ?? '',
        cardLast4: transaction.creditCard?.last4 ?? '',
      })
    } catch (error) {
      logger.error('Charge succeeded but the payment record failed to save', {
        braintreeTransactionId: transaction.id,
        enrollmentId: String(enrollment._id),
        error: error instanceof Error ? error.message : String(error),
      })
    }

    await recordAudit(req, {
      action: 'checkout.completed',
      entityType: 'Enrollment',
      entityId: String(enrollment._id),
      metadata: { programSlug, amountCents, braintreeTransactionId: transaction.id },
    })

    await notifyUser({
      userId: req.user!.id,
      type: 'payment_received',
      title: `Payment received for ${program.name}`,
      body: 'Your enrollment is now active. Next step: upload your documents.',
      href: '/dashboard',
    })

    res.status(201).json({
      code: 'CHECKOUT_COMPLETE',
      enrollmentId: String(enrollment._id),
      transactionId: transaction.id,
      amountCents,
    })
  }),
)

export default router
