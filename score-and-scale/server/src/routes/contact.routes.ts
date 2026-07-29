import { Router } from 'express'
import { z } from 'zod'
import { sendContactAcknowledgement, sendContactNotification } from '../lib/mailer'
import { asyncHandler } from '../middleware/errorHandler'
import { contactLimiter } from '../middleware/rateLimit'
import { validate } from '../middleware/validate'
import { ContactSubmission } from '../models/ContactSubmission'

const router = Router()

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  phone: z.string().trim().max(40).optional().default(''),
  topic: z
    .enum(['general', 'funding', 'credit', 'partnership', 'support'])
    .optional()
    .default('general'),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a little more (at least 10 characters)')
    .max(5000, 'Please keep your message under 5000 characters'),
  /**
   * Honeypot. Real users never see this field, so anything in it is a bot. The
   * request is accepted so the bot cannot tell it was filtered.
   */
  company: z.string().max(200).optional().default(''),
})

router.post(
  '/',
  contactLimiter,
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof contactSchema>

    if (input.company) {
      res.status(201).json({ code: 'CONTACT_RECEIVED' })
      return
    }

    await ContactSubmission.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      topic: input.topic,
      message: input.message,
      ip: req.ip ?? '',
      userAgent: (req.get('user-agent') ?? '').slice(0, 300),
    })

    /**
     * The submission is already durably stored, so email is fire-and-forget.
     * A mail outage must not present the visitor with an error for a message we
     * successfully captured.
     */
    void sendContactNotification({
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
    })
    void sendContactAcknowledgement({ to: input.email, name: input.name })

    res.status(201).json({ code: 'CONTACT_RECEIVED' })
  }),
)

export default router
