import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { ok } from '@/lib/envelope';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { optionalMember } from '@/middleware/memberAuth';
import { engagementLimiter } from '@/middleware/rateLimit';
import { validateBody } from '@/middleware/validate';
import { env } from '@/config/env';
import { sendToGhl } from '@/lib/ghl';
import { logger } from '@/lib/logger';
import { ApparelItem } from '@/models/content';
import { Engagement } from '@/models/engagement';

/**
 * Apparel engagement.
 *
 * In showcase mode this replaces the cart entirely: likes, saves, votes, and
 * notify-me are the signals that decide which pieces get manufactured. Because
 * they drive a real production decision, each is counted once per visitor —
 * enforced by a unique index, not by trusting the client.
 *
 * The counters on the item are denormalised for fast reads. The Engagement
 * collection remains the source of truth and can rebuild them.
 */
export const engagementRouter = Router();

const ACTIONS = ['like', 'favorite', 'vote', 'notify', 'share', 'view'] as const;
type Action = (typeof ACTIONS)[number];

/** Which counter each action increments. */
const COUNTER: Record<Action, string> = {
  like: 'engagement.likes',
  favorite: 'engagement.favorites',
  vote: 'engagement.votes',
  notify: 'engagement.notifyMeCount',
  share: 'engagement.shares',
  view: 'engagement.views',
};

const paramsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  action: z.enum(ACTIONS),
});

const bodySchema = z.object({
  email: z.string().email().optional(),
});

engagementRouter.post(
  '/:id/:action',
  engagementLimiter,
  optionalMember,
  validateBody(bodySchema),
  asyncHandler(async (req, res) => {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw ApiError.badRequest('That engagement action is not recognised.');
    const { id, action } = parsed.data;
    const visitorId = req.visitorId!;

    const item = await ApparelItem.findById(id).select('_id status');
    if (!item || item.status !== 'published') throw ApiError.notFound('That piece is not available.');

    // Shares and views are not identity-scoped — the same person may legitimately
    // share twice — so they increment without a dedup row.
    if (action === 'share' || action === 'view') {
      await ApparelItem.updateOne({ _id: id }, { $inc: { [COUNTER[action]]: 1 } });
      return ok(res, { action, counted: true });
    }

    try {
      await Engagement.create({
        visitorId,
        itemId: id,
        action,
        // Attributed to the member when signed in, so it follows them between
        // devices. Anonymous visitors still count exactly as before.
        memberId: req.member?.id ?? null,
        email:
          action === 'notify'
            ? ((req.body as { email?: string }).email ?? req.member?.email)
            : undefined,
      });
    } catch (error) {
      // Duplicate key: already registered. Idempotent by design — the visitor's
      // intent is recorded, so this is a success, not an error.
      if ((error as { code?: number }).code === 11000) {
        return ok(res, { action, counted: false, alreadyRegistered: true });
      }
      throw error;
    }

    const updated = await ApparelItem.findOneAndUpdate(
      { _id: id },
      { $inc: { [COUNTER[action]]: 1 } },
      { new: true, projection: 'name slug collectionId engagement' }
    );

    ok(res, { action, counted: true });

    /**
     * Announce a vote milestone, after the visitor has their response.
     *
     * Deliberately not awaited: the founder being told a design has demand is
     * not something a visitor should wait for, and `announceMilestone` never
     * throws, so there is no rejection to leave unhandled.
     */
    if (action === 'vote' && updated) void announceMilestone(updated);
  })
);

/**
 * Tells the GHL side that a piece has reached a vote count worth a decision.
 *
 * The decision to manufacture is the founder's, so this carries a signal, not
 * an instruction, and it goes to him rather than to the audience. Announcing a
 * drop to the people who asked to hear about it is a separate, deliberate act
 * from the CMS once that decision is made.
 *
 * Only the highest milestone crossed is sent. If the counter jumps — a recount,
 * or an operator correcting a figure — passing two thresholds at once should
 * read as one piece of news, not a burst.
 */
async function announceMilestone(item: {
  /** Mongoose types the `id` virtual as optional, so `_id` is the reliable one. */
  _id: unknown;
  name: string;
  slug: string;
  collectionId?: unknown;
  engagement?: {
    votes?: number;
    likes?: number;
    favorites?: number;
    notifyMeCount?: number;
    shares?: number;
    views?: number;
    milestonesReached?: number[];
  } | null;
}): Promise<void> {
  try {
    const votes = item.engagement?.votes ?? 0;
    const already = item.engagement?.milestonesReached ?? [];
    const crossed = env.VOTE_MILESTONES.filter((m) => votes >= m && !already.includes(m));
    if (crossed.length === 0) return;

    const milestone = crossed[crossed.length - 1]!;

    /**
     * Claim the milestone before sending. The filter only matches while the
     * number is absent, so of several concurrent votes crossing the same
     * threshold exactly one gets modifiedCount 1 and the rest fall through.
     * Any lower thresholds crossed in the same jump are recorded at the same
     * time so they cannot fire later.
     */
    const claim = await ApparelItem.updateOne(
      { _id: item._id, 'engagement.milestonesReached': { $ne: milestone } },
      { $addToSet: { 'engagement.milestonesReached': { $each: crossed } } }
    );
    if (claim.modifiedCount !== 1) return;

    const itemId = String(item._id);
    const e = item.engagement ?? {};
    await sendToGhl({
      event: 'apparel.vote_milestone',
      sentAt: new Date().toISOString(),
      milestone,
      piece: {
        id: itemId,
        name: item.name,
        slug: item.slug,
        collection: item.collectionId ? String(item.collectionId) : null,
        publicUrl: `${env.SITE_URL.replace(/\/$/, '')}/collections/item/${item.slug}`,
        adminUrl: `${env.ADMIN_URL.replace(/\/$/, '')}/records/apparel/${itemId}`,
      },
      engagement: {
        votes,
        likes: e.likes ?? 0,
        favorites: e.favorites ?? 0,
        notifyMeCount: e.notifyMeCount ?? 0,
        shares: e.shares ?? 0,
        views: e.views ?? 0,
      },
    });
  } catch (error) {
    /** A milestone announcement must never surface as a failed vote. */
    logger.warn({ error }, 'vote milestone announcement failed');
  }
}

engagementRouter.post(
  '/:id/:action/undo',
  engagementLimiter,
  asyncHandler(async (req, res) => {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw ApiError.badRequest('That engagement action is not recognised.');
    const { id, action } = parsed.data;

    if (action === 'share' || action === 'view') {
      throw ApiError.badRequest('That action cannot be undone.');
    }

    const removed = await Engagement.deleteOne({ visitorId: req.visitorId, itemId: id, action });

    if (removed.deletedCount > 0) {
      // $max guards against a counter going negative if the row was
      // double-removed or the denormalised value drifted.
      await ApparelItem.updateOne({ _id: id }, { $inc: { [COUNTER[action]]: -1 } });
      await ApparelItem.updateOne(
        { _id: id, [COUNTER[action]]: { $lt: 0 } },
        { $set: { [COUNTER[action]]: 0 } }
      );
    }

    ok(res, { action, removed: removed.deletedCount > 0 });
  })
);

/** What this visitor has already registered, so the UI can restore its state. */
engagementRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const rows = await Engagement.find({ visitorId: req.visitorId }).select('itemId action');
    const grouped: Record<string, string[]> = { like: [], favorite: [], vote: [], notify: [] };
    for (const row of rows) {
      (grouped[row.action] ??= []).push(String(row.itemId));
    }
    ok(res, grouped);
  })
);

/**
 * Vote totals per collection — the readout that decides the next production run.
 * Public, because showing it is what makes voting feel worth doing.
 */
engagementRouter.get(
  '/vote-totals',
  asyncHandler(async (_req, res) => {
    const totals = await ApparelItem.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$collectionId',
          votes: { $sum: '$engagement.votes' },
          likes: { $sum: '$engagement.likes' },
          items: { $sum: 1 },
        },
      },
      { $lookup: { from: 'collections', localField: '_id', foreignField: '_id', as: 'collection' } },
      { $unwind: { path: '$collection', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          collectionId: '$_id',
          slug: '$collection.slug',
          name: { $ifNull: ['$collection.name', 'Uncategorised'] },
          votes: 1,
          likes: 1,
          items: 1,
        },
      },
      { $sort: { votes: -1 } },
    ]);

    const max = totals[0]?.votes || 1;
    ok(
      res,
      totals.map((row: { votes: number }) => ({
        ...row,
        percent: Math.round((row.votes / max) * 100),
      }))
    );
  })
);

/** Per-item breakdown for the CMS. */
engagementRouter.get(
  '/report',
  requireAuth,
  requirePermission('analytics:read'),
  asyncHandler(async (_req, res) => {
    const items = await ApparelItem.find({ status: { $ne: 'archived' } })
      .select('name slug badge engagement collectionId')
      .sort({ 'engagement.votes': -1 });
    ok(res, items);
  })
);
