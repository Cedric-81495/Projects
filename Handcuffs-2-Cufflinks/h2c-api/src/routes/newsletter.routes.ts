import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { newsletterSchema } from '../validation/schemas.js';
import { NewsletterModel } from '../models/Newsletter.js';

export const newsletterRouter = Router();

// POST /api/newsletter
newsletterRouter.post(
  '/',
  validateBody(newsletterSchema),
  asyncHandler(async (req, res) => {
    const { email, source } = req.body;
    // Idempotent: re-subscribing the same email is a success, not an error.
    await NewsletterModel.updateOne(
      { email },
      { $setOnInsert: { email, source: source ?? 'site' } },
      { upsert: true },
    );
    res.status(201).json({ ok: true });
  }),
);
