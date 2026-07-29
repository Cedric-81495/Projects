import { Router } from 'express';
import { Enrollment } from '../models/Enrollment';
import { Payment } from '../models/Payment';
import { ContactSubmission } from '../models/ContactSubmission';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// Every route here is admin-only — both middlewares run on every request below.
router.use(requireAuth, requireAdmin);

router.get('/kpis', async (_req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalEnrollments, activeEnrollments, newContactSubmissions, monthPayments] = await Promise.all([
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: 'active' }),
    ContactSubmission.countDocuments({ status: 'new' }),
    Payment.find({ status: 'succeeded', createdAt: { $gte: startOfMonth } }),
  ]);

  const revenueThisMonthCents = monthPayments.reduce((sum, p) => sum + p.amountCents, 0);

  res.json({ totalEnrollments, activeEnrollments, newContactSubmissions, revenueThisMonthCents });
});

router.get('/enrollments', async (_req, res) => {
  const enrollments = await Enrollment.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'email')
    .populate('programId', 'name');

  res.json(
    enrollments.map((e) => ({
      id: e._id,
      userEmail: (e.userId as any)?.email ?? 'unknown',
      programName: (e.programId as any)?.name ?? 'unknown',
      status: e.status,
    }))
  );
});

router.get('/contacts', async (_req, res) => {
  const submissions = await ContactSubmission.find().sort({ createdAt: -1 }).limit(200);
  res.json(submissions);
});

router.get('/payments', async (_req, res) => {
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
    .populate({
      path: 'enrollmentId',
      populate: [
        { path: 'userId', select: 'email' },
        { path: 'programId', select: 'name' },
      ],
    });

  res.json(
    payments.map((p) => {
      const enrollment = p.enrollmentId as any;
      return {
        id: p._id,
        userEmail: enrollment?.userId?.email ?? 'unknown',
        programName: enrollment?.programId?.name ?? 'unknown',
        amountCents: p.amountCents,
        status: p.status,
        braintreeTransactionId: p.braintreeTransactionId,
        createdAt: p.createdAt,
      };
    })
  );
});

export default router;
