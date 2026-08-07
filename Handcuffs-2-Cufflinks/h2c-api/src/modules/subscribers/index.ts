import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { created, ok, page } from '@/lib/envelope';
import { audit } from '@/middleware/audit';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { submissionLimiter } from '@/middleware/rateLimit';
import { query, validateBody, validateQuery } from '@/middleware/validate';
import { Subscriber } from '@/models/Subscriber';

/**
 * Join the Movement — the North Star metric.
 *
 * Consent is captured per channel, with the timestamp, because "what did they
 * agree to and when" is the question a compliance review actually asks.
 */
export const subscriberRouter = Router();

const subscribeSchema = z.object({
  firstName: z.string().trim().min(1, 'Add your first name.').max(80),
  email: z.string().email('Check the email address — it needs an @ and a domain.'),
  mobile: z.string().trim().max(40).optional(),
  interests: z.array(z.string().max(60)).max(20).default([]),
  consentEmail: z.literal(true, {
    errorMap: () => ({ message: 'Tick the box so we can email you.' }),
  }),
  consentSms: z.boolean().default(false),
});

subscriberRouter.post(
  '/',
  submissionLimiter,
  validateBody(subscribeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof subscribeSchema>;
    const email = body.email.toLowerCase();

    const existing = await Subscriber.findOne({ email });

    if (existing) {
      // Re-subscribing after leaving is a normal thing to do, and refusing it
      // would be hostile. Update consent and revive rather than erroring.
      existing.firstName = body.firstName;
      existing.mobile = body.mobile;
      existing.interests = body.interests;
      existing.consentEmail = body.consentEmail;
      existing.consentSms = body.consentSms;
      existing.consentAt = new Date();
      existing.status = 'subscribed';
      existing.unsubscribedAt = null;
      await existing.save();

      // Deliberately identical response to a new signup: whether an address is
      // already on the list is not something an anonymous caller should learn.
      return created(res, { subscribed: true });
    }

    await Subscriber.create({ ...body, email, consentAt: new Date(), consentSource: 'website' });
    created(res, { subscribed: true });
  })
);

/** One-click unsubscribe. No login, no lookup by email. */
subscriberRouter.get(
  '/unsubscribe/:token',
  asyncHandler(async (req, res) => {
    const subscriber = await Subscriber.findOne({ unsubscribeToken: req.params.token });
    if (!subscriber) throw ApiError.notFound('That unsubscribe link is not valid.');

    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    subscriber.consentEmail = false;
    subscriber.consentSms = false;
    await subscriber.save();

    ok(res, { unsubscribed: true }, 'You have been removed from the list.');
  })
);

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(['subscribed', 'unsubscribed', 'bounced']).optional(),
});

subscriberRouter.get(
  '/',
  requireAuth,
  requirePermission('subscribers:read'),
  validateQuery(listSchema),
  asyncHandler(async (req, res) => {
    const q = query<z.infer<typeof listSchema>>(req);
    const filter = q.status ? { status: q.status } : {};

    const [items, total] = await Promise.all([
      Subscriber.find(filter)
        .select('-unsubscribeToken')
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.pageSize)
        .limit(q.pageSize),
      Subscriber.countDocuments(filter),
    ]);

    ok(res, page(items, total, q.page, q.pageSize));
  })
);

/**
 * Export is a separate permission from read: a paginated view is routine, while
 * walking off with the entire audience list is not. It is also audited.
 */
subscriberRouter.get(
  '/export',
  requireAuth,
  requirePermission('subscribers:export'),
  asyncHandler(async (req, res) => {
    const rows = await Subscriber.find({ status: 'subscribed' })
      .select('firstName email mobile interests consentEmail consentSms consentAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    audit(req, 'subscribers.export', 'subscriber', { meta: { count: rows.length } });

    const header = 'firstName,email,mobile,interests,consentEmail,consentSms,consentAt,createdAt';
    const csv = [
      header,
      ...rows.map((r) =>
        [
          csvCell(r.firstName),
          csvCell(r.email),
          csvCell(r.mobile ?? ''),
          csvCell((r.interests ?? []).join('; ')),
          r.consentEmail,
          r.consentSms,
          r.consentAt?.toISOString() ?? '',
          r.createdAt?.toISOString() ?? '',
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="h2c-subscribers.csv"');
    res.send(csv);
  })
);

/**
 * Quotes every cell and neutralises leading =, +, -, @ — Excel and Sheets
 * execute those as formulas, which turns an exported list into a delivery
 * mechanism for whatever someone typed into a public signup form.
 */
function csvCell(value: string): string {
  const escaped = String(value).replace(/"/g, '""');
  const safe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
  return `"${safe}"`;
}
