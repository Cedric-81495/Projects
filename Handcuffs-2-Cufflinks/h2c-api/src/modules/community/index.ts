import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { created, ok, page } from '@/lib/envelope';
import { requestSiteRebuild } from '@/lib/deployHook';
import { audit } from '@/middleware/audit';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { submissionLimiter } from '@/middleware/rateLimit';
import { query, validateBody, validateQuery } from '@/middleware/validate';
import { CommunityApplication, CommunityStory, GuestNomination } from '@/models/community';

/**
 * Community submissions and moderation.
 *
 * Nothing here is ever published automatically. Two gates apply: a moderator
 * must approve it, and the author must have granted publication consent. The
 * consent check is enforced here rather than trusted from the CMS, because the
 * cost of getting it wrong is publishing someone's story without permission.
 */
export const communityRouter = Router();

const consentSchema = z.object({
  publishStory: z.boolean().default(false),
  publishName: z.boolean().default(false),
  publishImagery: z.boolean().default(false),
  contactForFollowUp: z.boolean().default(false),
});

const storySubmissionSchema = z.object({
  authorName: z.string().trim().min(1, 'Add your name.').max(120),
  authorEmail: z.string().email('Add an email so we can reach you.'),
  authorLocation: z.string().trim().max(160).default(''),
  transformationArc: z.string().trim().min(1, 'Sum it up in one line.').max(200),
  story: z.string().trim().min(1, 'Tell us as much as you want to.').max(20000),
  videoUrl: z.string().url().optional().or(z.literal('')),
  consent: consentSchema,
});

communityRouter.post(
  '/stories',
  submissionLimiter,
  validateBody(storySubmissionSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof storySubmissionSchema>;

    await CommunityStory.create({
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      authorLocation: body.authorLocation,
      transformationArc: body.transformationArc,
      fullStory: body.story,
      videoUrl: body.videoUrl || undefined,
      consent: { ...body.consent, agreedAt: new Date() },
      moderation: { state: 'pending' },
      status: 'draft',
    });

    created(res, { received: true }, 'Received. A real person reads every submission.');
  })
);

/** Public: approved, published, consented stories only. */
communityRouter.get(
  '/stories',
  validateQuery(z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(60).default(24),
    featured: z.enum(['true', 'false']).optional(),
  })),
  asyncHandler(async (req, res) => {
    const q = query<{ page: number; pageSize: number; featured?: string }>(req);
    const filter: Record<string, unknown> = {
      status: 'published',
      'moderation.state': 'approved',
      'consent.publishStory': true,
    };
    if (q.featured) filter.isFeatured = q.featured === 'true';

    const [items, total] = await Promise.all([
      CommunityStory.find(filter)
        .select('-authorEmail')
        .sort({ isFeatured: -1, publishedAt: -1 })
        .skip((q.page - 1) * q.pageSize)
        .limit(q.pageSize),
      CommunityStory.countDocuments(filter),
    ]);

    // Names are withheld unless that specific permission was granted.
    const safe = items.map((doc) => {
      const obj = doc.toJSON() as Record<string, unknown>;
      if (!(doc.consent as { publishName?: boolean })?.publishName) {
        obj.authorName = 'Anonymous';
        obj.authorLocation = '';
      }
      return obj;
    });

    ok(res, page(safe, total, q.page, q.pageSize));
  })
);

communityRouter.post(
  '/volunteer',
  submissionLimiter,
  validateBody(z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    interests: z.array(z.string().max(80)).default([]),
    availability: z.string().max(400).optional(),
    message: z.string().max(4000).optional(),
  })),
  asyncHandler(async (req, res) => {
    await CommunityApplication.create({ ...(req.body as object), kind: 'volunteer' });
    created(res, { received: true });
  })
);

communityRouter.post(
  '/mentorship-applications',
  submissionLimiter,
  validateBody(z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    interests: z.array(z.string().max(80)).default([]),
    availability: z.string().max(400).optional(),
    message: z.string().max(4000).optional(),
  })),
  asyncHandler(async (req, res) => {
    await CommunityApplication.create({ ...(req.body as object), kind: 'mentorship' });
    created(res, { received: true });
  })
);

/* ---------------------------- Moderation ---------------------------- */

communityRouter.get(
  '/stories/admin/all',
  requireAuth,
  requirePermission('community:moderate'),
  validateQuery(z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    state: z.enum(['pending', 'approved', 'rejected', 'needs-changes']).optional(),
  })),
  asyncHandler(async (req, res) => {
    const q = query<{ page: number; pageSize: number; state?: string }>(req);
    const filter = q.state ? { 'moderation.state': q.state } : {};

    const [items, total] = await Promise.all([
      CommunityStory.find(filter).sort({ createdAt: -1 })
        .skip((q.page - 1) * q.pageSize).limit(q.pageSize),
      CommunityStory.countDocuments(filter),
    ]);

    ok(res, page(items, total, q.page, q.pageSize));
  })
);

communityRouter.post(
  '/stories/:id/moderate',
  requireAuth,
  requirePermission('community:moderate'),
  validateBody(z.object({
    state: z.enum(['pending', 'approved', 'rejected', 'needs-changes']),
    notes: z.string().max(2000).optional(),
    quote: z.string().max(500).optional(),
    isFeatured: z.boolean().optional(),
    publish: z.boolean().default(false),
  })),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      state: string; notes?: string; quote?: string; isFeatured?: boolean; publish: boolean;
    };

    const story = await CommunityStory.findById(req.params.id);
    if (!story) throw ApiError.notFound();

    // The consent gate. A moderator cannot publish a story whose author did not
    // agree to publication, regardless of what the CMS sent.
    if (body.publish && !(story.consent as { publishStory?: boolean })?.publishStory) {
      throw ApiError.badRequest(
        'This author has not given permission to publish their story. Contact them before featuring it.'
      );
    }

    story.moderation = {
      state: body.state as 'pending' | 'approved' | 'rejected' | 'needs-changes',
      reviewedBy: req.actor!.id as never,
      reviewedAt: new Date(),
      notes: body.notes,
    } as typeof story.moderation;
    if (body.quote !== undefined) story.quote = body.quote;
    if (body.isFeatured !== undefined) story.isFeatured = body.isFeatured;

    if (body.publish && body.state === 'approved') {
      story.status = 'published';
      story.publishedAt = new Date();
    } else if (!body.publish) {
      story.status = 'draft';
    }

    await story.save();

    audit(req, 'community-story.moderate', 'community-story', {
      resourceId: req.params.id,
      meta: { state: body.state, published: story.status === 'published' },
    });

    if (story.status === 'published') requestSiteRebuild('community-story.publish');
    ok(res, story);
  })
);

communityRouter.post(
  '/guest-nominations',
  submissionLimiter,
  validateBody(z.object({
    nomineeName: z.string().trim().min(1, 'Add their name.').max(160),
    nomineeStory: z.string().trim().min(1, 'Tell us a little about their story.').max(6000),
    nominatorName: z.string().trim().min(1, 'Add your name.').max(120),
    nominatorEmail: z.string().email('Add an email so we can reply.'),
    relationship: z.string().max(200).optional(),
    contactInfo: z.string().max(400).optional(),
  })),
  asyncHandler(async (req, res) => {
    await GuestNomination.create(req.body as object);
    created(res, { received: true }, 'Thank you. We read every nomination.');
  })
);

communityRouter.get(
  '/guest-nominations',
  requireAuth,
  requirePermission('community:moderate'),
  asyncHandler(async (_req, res) => {
    const items = await GuestNomination.find().sort({ createdAt: -1 }).limit(200);
    ok(res, items);
  })
);

communityRouter.get(
  '/applications',
  requireAuth,
  requirePermission('community:moderate'),
  asyncHandler(async (_req, res) => {
    const items = await CommunityApplication.find().sort({ createdAt: -1 }).limit(200);
    ok(res, items);
  })
);
