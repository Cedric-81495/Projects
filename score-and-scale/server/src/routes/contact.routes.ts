import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { ContactSubmission } from '../models/ContactSubmission';
import { sendMail } from '../lib/mailer';

const router = Router();

// Unauthenticated endpoint — worth its own limiter separate from any global one.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many messages sent — please try again later.' },
});

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

router.post('/', contactLimiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Fill in your name, email, and message.' });
  const { name, email, message } = parsed.data;

  const submission = await ContactSubmission.create({ name, email, message });

  if (process.env.CONTACT_NOTIFY_EMAIL) {
    await sendMail({
      to: process.env.CONTACT_NOTIFY_EMAIL,
      subject: `New contact form submission from ${name}`,
      html: `<p><b>${name}</b> (${email}) wrote:</p><p>${message}</p>`,
    }).catch((err) => console.error('Failed to send contact notification email:', err));
  }

  res.status(201).json({ id: submission._id });
});

export default router;
