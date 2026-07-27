// server/src/routes/payments.routes.ts  (NEW FILE)

import { Router } from 'express';
import { Payment } from '../models/Payment';
import { Enrollment } from '../models/Enrollment';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// GET /api/payments — the current user's own payment history, most recent
// first. Payment has no userId of its own (traced via enrollmentId only —
// see Payment.ts), so we first resolve which enrollments belong to this
// user, then pull payments for those enrollments.
router.get('/', requireAuth, async (req, res) => {
  const enrollments = await Enrollment.find({ userId: req.user!.userId })
    .select('_id programId')
    .populate('programId', 'name');

  const programNameByEnrollment = new Map(
    enrollments.map((e) => [e._id.toString(), (e.programId as any)?.name ?? 'Unknown program'])
  );
  const enrollmentIds = enrollments.map((e) => e._id);

  const payments = await Payment.find({ enrollmentId: { $in: enrollmentIds } }).sort({ createdAt: -1 });

  res.json(
    payments.map((p) => ({
      id: p._id,
      programName: programNameByEnrollment.get(p.enrollmentId.toString()) ?? 'Unknown program',
      amountCents: p.amountCents,
      status: p.status,
      braintreeTransactionId: p.braintreeTransactionId,
      createdAt: p.createdAt,
    }))
  );
});

export default router;
