import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { created, ok, page } from '@/lib/envelope';
import { hashPassword } from '@/lib/password';
import { audit } from '@/middleware/audit';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { query, validateBody, validateQuery } from '@/middleware/validate';
import { AuditLog } from '@/models/AuditLog';
import { RefreshToken } from '@/models/RefreshToken';
import { User } from '@/models/User';
import { createUserSchema } from '@/modules/auth/auth.schemas';
import { publicUser } from '@/modules/auth/auth.service';

/**
 * User and role administration. Restricted to super administrators, since it is
 * the one area where a mistake can hand over the whole platform.
 */
export const userRouter = Router();

userRouter.use(requireAuth);

/**
 * Read-only and super-admin only.
 *
 * Declared before the '/:id/...' routes: Express matches in order, and
 * '/audit-log' would otherwise be captured as an :id by a later route.
 */
/** Audit log is read-only and super-admin only. */
userRouter.get(
  '/audit-log',
  requirePermission('audit:read'),
  validateQuery(z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    action: z.string().max(80).optional(),
    resource: z.string().max(80).optional(),
  })),
  asyncHandler(async (req, res) => {
    const q = query<{ page: number; pageSize: number; action?: string; resource?: string }>(req);
    const filter: Record<string, unknown> = {};
    if (q.action) filter.action = q.action;
    if (q.resource) filter.resource = q.resource;

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 })
        .skip((q.page - 1) * q.pageSize).limit(q.pageSize),
      AuditLog.countDocuments(filter),
    ]);

    ok(res, page(items, total, q.page, q.pageSize));
  })
);

userRouter.get(
  '/',
  requirePermission('users:manage'),
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    ok(res, users.map(publicUser));
  })
);

userRouter.post(
  '/',
  requirePermission('users:manage'),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createUserSchema>;
    const email = body.email.toLowerCase();

    if (await User.exists({ email })) throw ApiError.conflict('An account already uses that email.');

    const user = await User.create({
      fullName: body.fullName,
      email,
      passwordHash: await hashPassword(body.password),
      role: body.role,
      emailVerified: false,
    });

    audit(req, 'user.create', 'user', { resourceId: String(user._id), meta: { role: body.role } });
    created(res, publicUser(user));
  })
);

userRouter.patch(
  '/:id/role',
  requirePermission('users:manage'),
  validateBody(z.object({ role: z.enum(['super-admin', 'admin']) })),
  asyncHandler(async (req, res) => {
    const { role } = req.body as { role: 'super-admin' | 'admin' };

    // Preventing self-demotion avoids locking the platform out of its own
    // administration, which is not recoverable through the UI.
    if (req.params.id === req.actor!.id) {
      throw ApiError.badRequest('You cannot change your own role.');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound();

    if (user.role === 'super-admin' && role !== 'super-admin') {
      const remaining = await User.countDocuments({ role: 'super-admin', isActive: true });
      if (remaining <= 1) {
        throw ApiError.badRequest('There must be at least one active Super Administrator.');
      }
    }

    user.role = role;
    // Existing access tokens carry the old role, so they must be invalidated.
    user.tokenVersion += 1;
    await user.save();

    audit(req, 'user.role-change', 'user', { resourceId: req.params.id, meta: { role } });
    ok(res, publicUser(user));
  })
);

userRouter.patch(
  '/:id/status',
  requirePermission('users:manage'),
  validateBody(z.object({ isActive: z.boolean() })),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body as { isActive: boolean };

    if (req.params.id === req.actor!.id) {
      throw ApiError.badRequest('You cannot deactivate your own account.');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound();

    if (!isActive && user.role === 'super-admin') {
      const remaining = await User.countDocuments({ role: 'super-admin', isActive: true });
      if (remaining <= 1) {
        throw ApiError.badRequest('There must be at least one active Super Administrator.');
      }
    }

    user.isActive = isActive;
    user.tokenVersion += 1;
    await user.save();

    // Deactivation must end current sessions, not just block future sign-ins.
    if (!isActive) {
      await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    }

    audit(req, isActive ? 'user.activate' : 'user.deactivate', 'user', { resourceId: req.params.id });
    ok(res, publicUser(user));
  })
);

