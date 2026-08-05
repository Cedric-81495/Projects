import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { communityStorySchema } from '../validation/schemas.js';
import { CommunityStoryModel } from '../models/CommunityStory.js';

export const communityRouter = Router();

// POST /api/community/stories  (stored as 'pending' for moderation)
communityRouter.post(
  '/stories',
  validateBody(communityStorySchema),
  asyncHandler(async (req, res) => {
    await CommunityStoryModel.create({ ...req.body, status: 'pending' });
    res.status(201).json({ ok: true });
  }),
);

// GET /api/community/stories  (public gallery — approved only, no emails)
communityRouter.get(
  '/stories',
  asyncHandler(async (_req, res) => {
    const docs = await CommunityStoryModel.find({ status: 'approved' })
      .sort({ updatedAt: -1 })
      .select('title story name updatedAt')
      .lean();
    const data = docs.map((d) => ({
      id: String(d._id),
      title: d.title,
      story: d.story,
      name: d.name,
    }));
    res.json({ data });
  }),
);
