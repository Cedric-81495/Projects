import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireUser } from '../middleware/requireUser.js';
import { HttpError } from '../middleware/errorHandler.js';
import { myStorySchema } from '../validation/schemas.js';
import { UserModel, toPublicUser } from '../models/User.js';
import { CommunityStoryModel } from '../models/CommunityStory.js';

export const meRouter = Router();

// Everything here requires a signed-in member.
meRouter.use(requireUser);

/**
 * GET /api/me/profile
 * The "premium" member profile: account details, membership badge, and a
 * summary of the member's own story submissions with their moderation status.
 */
meRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).lean();
    if (!user) throw new HttpError(401, 'Account not found.');

    const stories = await CommunityStoryModel.find({ authorUserId: user._id })
      .sort({ createdAt: -1 })
      .select('title story status createdAt')
      .lean();

    const submissions = stories.map((s) => ({
      id: String(s._id),
      title: s.title,
      story: s.story,
      status: s.status,
      submittedAt: s.createdAt,
    }));

    res.json({
      user: toPublicUser(user),
      stats: {
        submissions: submissions.length,
        approved: submissions.filter((s) => s.status === 'approved').length,
        pending: submissions.filter((s) => s.status === 'pending').length,
      },
      submissions,
    });
  }),
);

/** GET /api/me/stories — the member's own submissions. */
meRouter.get(
  '/stories',
  asyncHandler(async (req, res) => {
    const stories = await CommunityStoryModel.find({ authorUserId: req.user!.id })
      .sort({ createdAt: -1 })
      .select('title story status createdAt')
      .lean();
    res.json({
      data: stories.map((s) => ({
        id: String(s._id),
        title: s.title,
        story: s.story,
        status: s.status,
        submittedAt: s.createdAt,
      })),
    });
  }),
);

/**
 * POST /api/me/stories
 * A signed-in member submits their story. Name/email are taken from the
 * account (not the request), and it enters the same moderation queue.
 */
meRouter.post(
  '/stories',
  validateBody(myStorySchema),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).select('name email').lean();
    if (!user) throw new HttpError(401, 'Account not found.');

    await CommunityStoryModel.create({
      authorUserId: user._id,
      name: user.name,
      email: user.email,
      title: req.body.title,
      story: req.body.story,
      status: 'pending',
    });
    res.status(201).json({ ok: true });
  }),
);
