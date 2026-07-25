import { Router } from 'express';
import { z } from 'zod';
import { Enrollment } from '../models/Enrollment';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

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
