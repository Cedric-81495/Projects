import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { Model } from 'mongoose';
import type { ZodTypeAny } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { HttpError } from '../middleware/errorHandler.js';
import { verifyAdminCredentials } from '../auth/admin.js';
import { signAdminToken, setAuthCookie, clearAuthCookie } from '../auth/tokens.js';
import {
  loginSchema,
  moderateSchema,
  storyInputSchema,
  episodeInputSchema,
  trackInputSchema,
  storyPatchSchema,
  episodePatchSchema,
  trackPatchSchema,
} from '../validation/schemas.js';
import { CommunityStoryModel } from '../models/CommunityStory.js';
import { StoryModel } from '../models/Story.js';
import { EpisodeModel } from '../models/Episode.js';
import { TrackModel } from '../models/Track.js';

export const adminRouter = Router();

// Auth
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait and try again.' },
});

adminRouter.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ok = await verifyAdminCredentials(email, password);
    if (!ok) throw new HttpError(401, 'Invalid email or password.');
    setAuthCookie(res, signAdminToken(email.toLowerCase()));
    res.json({ ok: true, admin: { email: email.toLowerCase(), role: 'admin' } });
  }),
);

adminRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Everything below requires a valid admin session.
adminRouter.use(requireAdmin);

adminRouter.get('/me', (req, res) => {
  res.json({ admin: req.admin });
});

// Community moderation
adminRouter.get(
  '/community/stories',
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    const filter =
      status === 'pending' || status === 'approved' || status === 'rejected'
        ? { status }
        : {};
    const data = await CommunityStoryModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ data });
  }),
);

adminRouter.patch(
  '/community/stories/:id',
  validateBody(moderateSchema),
  asyncHandler(async (req, res) => {
    const doc = await CommunityStoryModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    ).lean();
    if (!doc) throw new HttpError(404, 'Submission not found.');
    res.json({ data: doc });
  }),
);

// Content CRUD factory (shared by stories / episodes / tracks)
function contentCrud(
  model: Model<Record<string, unknown>>,
  createSchema: ZodTypeAny,
  patchSchema: ZodTypeAny,
) {
  const r = Router();

  r.get(
    '/',
    asyncHandler(async (_req, res) => {
      const data = await model.find().sort({ order: 1, createdAt: -1 }).lean();
      res.json({ data });
    }),
  );

  r.post(
    '/',
    validateBody(createSchema),
    asyncHandler(async (req, res) => {
      const created = await model.create(req.body);
      res.status(201).json({ data: created });
    }),
  );

  r.patch(
    '/:id',
    validateBody(patchSchema),
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
      if (!doc) throw new HttpError(404, 'Item not found.');
      res.json({ data: doc });
    }),
  );

  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndDelete(req.params.id).lean();
      if (!doc) throw new HttpError(404, 'Item not found.');
      res.json({ ok: true });
    }),
  );

  return r;
}

adminRouter.use('/stories', contentCrud(StoryModel as never, storyInputSchema, storyPatchSchema));
adminRouter.use('/episodes', contentCrud(EpisodeModel as never, episodeInputSchema, episodePatchSchema));
adminRouter.use('/tracks', contentCrud(TrackModel as never, trackInputSchema, trackPatchSchema));
