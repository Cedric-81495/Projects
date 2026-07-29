import { Router, raw } from 'express'
import { getBraintreeGateway } from '../lib/braintree'
import { badRequest } from '../lib/errors'
import { logger } from '../lib/logger'
import { notifyUser } from '../lib/notify'
import { asyncHandler } from '../middleware/errorHandler'
import { Enrollment } from '../models/Enrollment'
import { Payment } from '../models/Payment'

const router = Router()

/**
 * Braintree webhooks.
 *
 * A one-time Drop-in sale is confirmed synchronously in checkout, so this route
 * is not on the critical path for granting access. It exists to keep records
 * truthful after the fact — disputes and refunds happen days later and would
 * otherwise never be reflected.
 *
 * Braintree posts form-encoded data, and the payload is signed. The signature is
 * verified through the gateway before anything is trusted, since this endpoint
 * is necessarily unauthenticated and therefore publicly reachable.
 */
router.post(
  '/braintree',
  raw({ type: '*/*', limit: '1mb' }),
  asyncHandler(async (req, res) => {
    const body = new URLSearchParams(
      Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? ''),
    )

    const signature = body.get('bt_signature')
    const payload = body.get('bt_payload')

    if (!signature || !payload) {
      throw badRequest('WEBHOOK_MALFORMED', 'Missing webhook signature or payload.')
    }

    const gateway = getBraintreeGateway()

    let notification
    try {
      notification = await gateway.webhookNotification.parse(signature, payload)
    } catch (error) {
      // A bad signature means the request did not come from Braintree.
      logger.warn('Rejected a Braintree webhook with an invalid signature', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw badRequest('WEBHOOK_SIGNATURE_INVALID', 'Invalid webhook signature.')
    }

    logger.info('Braintree webhook received', { kind: notification.kind })

    /**
     * WebhookNotification is a discriminated union in Braintree's types, and
     * `dispute`/`transaction` exist only on some members. Narrowing to the two
     * fields this handler reads keeps access type-safe without asserting a
     * specific member that a future SDK version might rename.
     */
    const event = notification as {
      kind: string
      dispute?: { transaction?: { id?: string } }
      transaction?: { id?: string }
    }

    const transactionId = event.dispute?.transaction?.id ?? event.transaction?.id

    switch (notification.kind) {
      /**
       * A dispute or reversal means the money is going back. The payment is
       * marked refunded and the enrollment moves to in_review so a human
       * decides whether access should continue.
       */
      case 'dispute_opened':
      case 'dispute_lost': {
        if (!transactionId) break

        const payment = await Payment.findOneAndUpdate(
          { braintreeTransactionId: transactionId },
          { $set: { status: 'refunded', failureReason: notification.kind } },
          { new: true },
        )

        if (payment) {
          const enrollment = await Enrollment.findByIdAndUpdate(
            payment.enrollmentId,
            {
              $set: { status: 'in_review' },
              $push: {
                history: {
                  status: 'in_review',
                  changedAt: new Date(),
                  changedBy: null,
                  note: `Braintree ${notification.kind}`,
                },
              },
            },
            { new: true },
          )

          if (enrollment) {
            await notifyUser({
              userId: enrollment.userId,
              type: 'enrollment_status',
              title: 'We need to review your enrollment',
              body: 'There was a problem with your payment. Our team will be in touch.',
              href: '/dashboard',
            })
          }
        }
        break
      }

      case 'dispute_won': {
        if (!transactionId) break
        await Payment.updateOne(
          { braintreeTransactionId: transactionId },
          { $set: { status: 'succeeded', failureReason: '' } },
        )
        break
      }

      default:
        // Unhandled kinds are acknowledged rather than retried forever.
        break
    }

    /**
     * Always 200 once the signature is verified. A non-2xx makes Braintree
     * retry, and retrying will not fix an event we simply do not handle.
     */
    res.status(200).json({ code: 'WEBHOOK_RECEIVED' })
  }),
)

export default router
