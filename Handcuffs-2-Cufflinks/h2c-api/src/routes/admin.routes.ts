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
  adminUserUpdateSchema,
} from '../validation/schemas.js';
import { CommunityStoryModel } from '../models/CommunityStory.js';
import { StoryModel } from '../models/Story.js';
import { EpisodeModel } from '../models/Episode.js';
import { TrackModel } from '../models/Track.js';
import { UserModel, toPublicUser } from '../models/User.js';
import { MemberModel } from '../models/Member.js';
import { NewsletterModel } from '../models/Newsletter.js';

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

// ── Dashboard overview ──
adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [
      users,
      admins,
      suspended,
      pendingStories,
      approvedStories,
      publishedStories,
      episodes,
      tracks,
      members,
      newsletter,
    ] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: 'admin' }),
      UserModel.countDocuments({ status: 'suspended' }),
      CommunityStoryModel.countDocuments({ status: 'pending' }),
      CommunityStoryModel.countDocuments({ status: 'approved' }),
      StoryModel.countDocuments({ published: true }),
      EpisodeModel.countDocuments({}),
      TrackModel.countDocuments({}),
      MemberModel.countDocuments({}),
      NewsletterModel.countDocuments({}),
    ]);

    const recentUsers = await UserModel.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      stats: {
        users,
        admins,
        suspended,
        pendingStories,
        approvedStories,
        publishedStories,
        episodes,
        tracks,
        members,
        newsletter,
      },
      recentUsers: recentUsers.map(toPublicUser),
    });
  }),
);

// ── User management ──
// GET /api/admin/users?search=&status=&role=&page=&limit=
adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const { search, status, role } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (status === 'active' || status === 'suspended') filter.status = status;
    if (role === 'user' || role === 'admin') filter.role = role;
    if (search && search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    res.json({
      data: docs.map(toPublicUser),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  }),
);

// GET /api/admin/users/:id — one member plus their submissions.
adminRouter.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.id).lean();
    if (!user) throw new HttpError(404, 'User not found.');
    const submissions = await CommunityStoryModel.find({ authorUserId: user._id })
      .sort({ createdAt: -1 })
      .select('title status createdAt')
      .lean();
    res.json({
      user: toPublicUser(user),
      submissions: submissions.map((s) => ({
        id: String(s._id),
        title: s.title,
        status: s.status,
        submittedAt: s.createdAt,
      })),
    });
  }),
);

// PATCH /api/admin/users/:id — change role / status / tier.
adminRouter.patch(
  '/users/:id',
  validateBody(adminUserUpdateSchema),
  asyncHandler(async (req, res) => {
    // Guard: an admin acting as a member can't demote or suspend themselves
    // (prevents locking yourself out of the dashboard).
    if (req.admin?.sub === req.params.id) {
      if (req.body.role === 'user' || req.body.status === 'suspended') {
        throw new HttpError(400, 'You cannot revoke your own admin access.');
      }
    }
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    ).lean();
    if (!user) throw new HttpError(404, 'User not found.');
    res.json({ user: toPublicUser(user) });
  }),
);

// DELETE /api/admin/users/:id — remove a member account.
adminRouter.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (req.admin?.sub === req.params.id) {
      throw new HttpError(400, 'You cannot delete your own account.');
    }
    const user = await UserModel.findByIdAndDelete(req.params.id).lean();
    if (!user) throw new HttpError(404, 'User not found.');
    res.json({ ok: true });
  }),
);

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
