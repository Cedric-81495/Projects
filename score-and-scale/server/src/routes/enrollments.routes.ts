import { Router } from 'express';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// GET /api/enrollments — all of the current user's enrollments (used by the dashboard)
router.get('/', requireAuth, async (req, res) => {
  const enrollments = await Enrollment.find({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .populate('programId', 'name slug');

  res.json(
    enrollments.map((e) => {
      const program = e.programId as any;
      return {
        id: e._id,
        programId: program?._id?.toString() ?? '',
        programSlug: program?.slug ?? '',
        programName: program?.name ?? 'Unknown program',
        status: e.status,
        history: e.history,
      };
    })
  );
});

// GET /api/enrollments/me — the current user's most recent enrollment
router.get('/me', requireAuth, async (req, res) => {
  const enrollment = await Enrollment.findOne({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .populate('programId', 'name');

  if (!enrollment) return res.status(404).json({ error: 'No enrollment found' });

  res.json({
    id: enrollment._id,
    programName: (enrollment.programId as any).name,
    status: enrollment.status,
    history: enrollment.history,
  });
});

// PATCH /api/enrollments/:id/cancel — user cancels their OWN pending/in-review
// enrollment request. Deliberately does not allow cancelling 'active' or
// 'funded' enrollments — those involve a real charge already settled, so
// unwinding them should go through an admin-managed refund flow
// (PATCH /:id/status), not a one-click self-service button.
const CANCELLABLE_STATUSES = new Set(['pending_payment', 'in_review']);

router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const enrollment = await Enrollment.findOne({ _id: req.params.id, userId: req.user!.userId });
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  if (!CANCELLABLE_STATUSES.has(enrollment.status)) {
    return res.status(400).json({ error: `An enrollment with status "${enrollment.status}" can't be self-cancelled.` });
  }

  enrollment.status = 'cancelled';
  enrollment.history.push({ status: 'cancelled', changedAt: new Date() });
  await enrollment.save();

  res.json({ id: enrollment._id, status: enrollment.status });
});

const statusSchema = z.object({
  status: z.enum(['pending_payment', 'active', 'in_review', 'funded', 'cancelled']),
});

// PATCH /api/enrollments/:id/status — admin only, appends to the audit trail
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  enrollment.status = parsed.data.status;
  enrollment.history.push({
    status: parsed.data.status,
    changedAt: new Date(),
    changedBy: req.user!.userId as any,
  });
  await enrollment.save();

  res.json({ id: enrollment._id, status: enrollment.status });
});

export default router;