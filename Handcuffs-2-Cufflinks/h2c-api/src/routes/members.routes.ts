import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { memberSchema } from '../validation/schemas.js';
import { MemberModel } from '../models/Member.js';

export const membersRouter = Router();

// POST /api/members
membersRouter.post(
  '/',
  validateBody(memberSchema),
  asyncHandler(async (req, res) => {
    const { name, email, interests } = req.body;
    await MemberModel.updateOne(
      { email },
      { $set: { name, interests }, $setOnInsert: { email } },
      { upsert: true },
    );
    res.status(201).json({ ok: true });
  }),
);
