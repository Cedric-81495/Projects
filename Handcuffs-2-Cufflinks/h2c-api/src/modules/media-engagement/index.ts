import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { ok } from '@/lib/envelope';
import { logger } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { engagementLimiter } from '@/middleware/rateLimit';
import { optionalMember } from '@/middleware/memberAuth';
import { validateBody, validateQuery, query } from '@/middleware/validate';
import {
  ALLOWED_ACTIONS,
  MEDIA_ACTIONS,
  MEDIA_TARGET_MODELS,
  MEDIA_TARGET_TYPES,
  MediaEngagement,
  dayKeyFor,
} from '@/models/mediaEngagement';
import type { MediaAction, MediaTargetType } from '@/models/mediaEngagement';

/**
 * Media engagement.
 *
 * The guide names music plays, docuseries views, and podcast performance as
 * KPIs. The models carried counters for them from the start but nothing ever
 * incremented them, so those figures read zero on the dashboard regardless of
 * how the movement was actually doing — which is worse than not showing them,
 * because a zero looks like a fact.
 *
 * The counter on the content document and the row in MediaEngagement serve
 * different questions. The counter answers "how many plays does this track
 * have" in one field read, on a page that lists twenty tracks. The rows answer
 * "how did last month go" and can rebuild the counters if they ever drift.
 */
export const mediaEngagementRouter = Router();

/** Which counter field on the content document each action increments. */
const COUNTER_FIELD: Record<MediaAction, string> = {
  view: 'engagement.views',
  play: 'engagement.plays',
  complete: 'engagement.completions',
  download: 'engagement.downloads',
  share: 'engagement.shares',
};

const trackBody = z
  .object({
    /**
     * Playback position when the event fired. Used to keep the furthest point
     * reached, which is what separates "started it" from "watched it".
     */
    percent: z.number().min(0).max(100).optional(),
  })
  .strict();

const paramsSchema = z.object({
  targetType: z.enum(MEDIA_TARGET_TYPES),
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Not a valid record id.'),
  action: z.enum(MEDIA_ACTIONS),
});

/**
 * Records one interaction.
 *
 * Public and anonymous — requiring an account to count a play would leave the
 * number measuring sign-ups rather than listening. `optionalMember` attaches
 * the member id when one happens to be signed in, so history follows them
 * across devices without gating anything on it.
 *
 * Responds 200 with `counted: false` for a repeat inside the same day rather
 * than an error. The client did nothing wrong; the event is simply already
 * represented, and a 409 would have players retrying in a loop.
 */
mediaEngagementRouter.post(
  '/:targetType/:id/:action',
  engagementLimiter,
  optionalMember,
  validateBody(trackBody),
  asyncHandler(async (req, res) => {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) throw ApiError.notFound();
    const { targetType, id, action } = parsed.data;

    if (!ALLOWED_ACTIONS[targetType].includes(action)) {
      throw ApiError.badRequest(
        `"${action}" is not something that happens to a ${targetType.replace(/-/g, ' ')}.`
      );
    }

    const model = mongoose.model(MEDIA_TARGET_MODELS[targetType]);

    /**
     * The target must exist and be published. Without this check the endpoint
     * doubles as a way to confirm whether a draft episode exists by watching
     * which ids return success — and drafts are frequently unannounced guests.
     */
    const target = await model.findOne({ _id: id, status: 'published' }).select('_id');
    if (!target) throw ApiError.notFound();

    const dayKey = dayKeyFor();
    const percent = (req.body as { percent?: number }).percent ?? 0;

    /**
     * One upsert decides everything. `$inc` on a field that does not yet exist
     * creates it at the increment value, so a new row lands with occurrences 1
     * and a repeat lifts it — which is also why no schema default is applied
     * here: `$setOnInsert`-ing occurrences alongside `$inc` on the same path is
     * a write conflict Mongo rejects outright.
     *
     * `new: false` returns the pre-update document, so a null return *is* the
     * answer to "was this their first today". The unique index arbitrates,
     * rather than a read followed by a write that two simultaneous players
     * would both win.
     */
    const filter = { visitorId: req.visitorId!, targetType, targetId: id, action, dayKey };
    const update = {
      $inc: { occurrences: 1 },
      $max: { furthestPercent: percent },
      ...(req.member ? { $set: { memberId: req.member.id } } : {}),
    };

    let isFirstToday: boolean;
    try {
      const before = await MediaEngagement.findOneAndUpdate(filter, update, { upsert: true, new: false });
      isFirstToday = before === null;
    } catch (error) {
      /**
       * Two concurrent upserts on the same key: one inserts, the other trips
       * the unique index. Mongo raises E11000 rather than serialising them, so
       * the loser has to retry — and by then the row exists, which makes this
       * definitionally not the visitor's first interaction today.
       *
       * A player firing `view` and `play` together on first load hits this, so
       * it is a routine path, not a rare one. Without the retry the visitor
       * would see a 409 from the global error handler.
       */
      if ((error as { code?: number }).code !== 11000) throw error;
      await MediaEngagement.updateOne(filter, update);
      isFirstToday = false;
    }

    if (isFirstToday) {
      // $inc by 1 on the denormalised counter, once per visitor per day. The
      // occurrences field holds the rest; adding every repeat here would make
      // "plays" mean something different from what the dashboard label says.
      await model
        .updateOne({ _id: id }, { $inc: { [COUNTER_FIELD[action]]: 1 } })
        .catch((error: unknown) => {
          // The row is written and is the source of truth, so a failed counter
          // update is a display inconsistency, not lost data. Log and move on
          // rather than failing a request the visitor cannot act on.
          logger.error({ error, targetType, id, action }, 'failed to increment media counter');
        });
    }

    ok(res, {
      counted: isFirstToday,
      alreadyRegisteredToday: !isFirstToday,
      targetType,
      targetId: id,
      action,
    });
  })
);

/* ------------------------------------------------------------------ */
/* Reporting                                                           */
/* ------------------------------------------------------------------ */

const reportQuery = z.object({
  targetType: z.enum(MEDIA_TARGET_TYPES).optional(),
  /** Trailing window. 90 days keeps the aggregation on the compound index. */
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

type ReportQuery = z.infer<typeof reportQuery>;

/**
 * Per-record totals over a trailing window.
 *
 * Aggregated from the rows rather than read off the counters, because the
 * counters are lifetime totals and the question a dashboard is actually asked
 * is "how is this doing lately".
 */
mediaEngagementRouter.get(
  '/report',
  requireAuth,
  requirePermission('analytics:read'),
  validateQuery(reportQuery),
  asyncHandler(async (req, res) => {
    const q = query<ReportQuery>(req);
    const since = dayKeyFor(new Date(Date.now() - q.days * 24 * 60 * 60 * 1000));

    const rows = await MediaEngagement.aggregate<{
      _id: { targetType: MediaTargetType; targetId: mongoose.Types.ObjectId };
      actions: { action: MediaAction; visitorDays: number; occurrences: number }[];
      total: number;
    }>([
      {
        $match: {
          dayKey: { $gte: since },
          ...(q.targetType ? { targetType: q.targetType } : {}),
        },
      },
      {
        $group: {
          _id: { targetType: '$targetType', targetId: '$targetId', action: '$action' },
          // One row is one visitor-day, so counting rows counts distinct
          // visitor-days directly — no $addToSet of visitor ids, which would
          // hold every id in memory for a popular track.
          visitorDays: { $sum: 1 },
          occurrences: { $sum: '$occurrences' },
        },
      },
      {
        $group: {
          _id: { targetType: '$_id.targetType', targetId: '$_id.targetId' },
          actions: {
            $push: { action: '$_id.action', visitorDays: '$visitorDays', occurrences: '$occurrences' },
          },
          total: { $sum: '$visitorDays' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: q.limit },
    ]);

    // Titles are fetched per target type in one query each rather than with a
    // $lookup, because targetId points at four different collections and
    // $lookup takes a single fixed `from`.
    const named = await attachTitles(rows);

    ok(res, { windowDays: q.days, since, items: named });
  })
);

interface ReportRow {
  _id: { targetType: MediaTargetType; targetId: mongoose.Types.ObjectId };
  actions: { action: MediaAction; visitorDays: number; occurrences: number }[];
  total: number;
}

async function attachTitles(rows: ReportRow[]) {
  const byType = new Map<MediaTargetType, string[]>();
  for (const row of rows) {
    const list = byType.get(row._id.targetType) ?? [];
    list.push(String(row._id.targetId));
    byType.set(row._id.targetType, list);
  }

  const titles = new Map<string, string>();
  await Promise.all(
    [...byType.entries()].map(async ([targetType, ids]) => {
      const model = mongoose.model(MEDIA_TARGET_MODELS[targetType]);
      const docs = await model.find({ _id: { $in: ids } }).select('title quote slug');
      for (const doc of docs) {
        const record = doc as unknown as { _id: unknown; title?: string; quote?: string };
        // Clips have no title — a clip is a quote, so that is its label.
        titles.set(String(record._id), record.title ?? record.quote ?? 'Untitled');
      }
    })
  );

  return rows.map((row) => ({
    targetType: row._id.targetType,
    targetId: String(row._id.targetId),
    title: titles.get(String(row._id.targetId)) ?? '(deleted)',
    total: row.total,
    actions: Object.fromEntries(
      row.actions.map((entry) => [entry.action, { visitorDays: entry.visitorDays, occurrences: entry.occurrences }])
    ),
  }));
}

const trendQuery = z.object({
  targetType: z.enum(MEDIA_TARGET_TYPES).optional(),
  action: z.enum(MEDIA_ACTIONS).optional(),
  days: z.coerce.number().int().min(7).max(365).default(30),
});

type TrendQuery = z.infer<typeof trendQuery>;

/**
 * Day-by-day totals, gap-filled.
 *
 * Days with no activity are returned as zero rather than omitted. A chart drawn
 * from sparse data silently closes the gaps and turns a quiet fortnight into a
 * straight line between two good days.
 */
mediaEngagementRouter.get(
  '/trend',
  requireAuth,
  requirePermission('analytics:read'),
  validateQuery(trendQuery),
  asyncHandler(async (req, res) => {
    const q = query<TrendQuery>(req);
    /**
     * `days - 1` back, so the series ends on today rather than yesterday. Off
     * by one here means a release that dropped this morning reads as zero for
     * its whole first day — the day anyone is actually watching.
     */
    const since = new Date(Date.now() - (q.days - 1) * 24 * 60 * 60 * 1000);

    const rows = await MediaEngagement.aggregate<{ _id: string; visitorDays: number; occurrences: number }>([
      {
        $match: {
          dayKey: { $gte: dayKeyFor(since) },
          ...(q.targetType ? { targetType: q.targetType } : {}),
          ...(q.action ? { action: q.action } : {}),
        },
      },
      { $group: { _id: '$dayKey', visitorDays: { $sum: 1 }, occurrences: { $sum: '$occurrences' } } },
    ]);

    const found = new Map(rows.map((row) => [row._id, row]));
    const series = Array.from({ length: q.days }, (_unused, index) => {
      const key = dayKeyFor(new Date(since.getTime() + index * 24 * 60 * 60 * 1000));
      const row = found.get(key);
      return { day: key, visitorDays: row?.visitorDays ?? 0, occurrences: row?.occurrences ?? 0 };
    });

    ok(res, { days: q.days, series });
  })
);

/**
 * Rebuilds every denormalised counter from the rows.
 *
 * The counters can drift — a failed `$inc` after a successful row write, or a
 * record restored from a backup taken between the two. Since the rows are the
 * source of truth, recovery is a recount rather than an investigation. Gated on
 * settings:manage because it rewrites figures across four collections, and
 * audited by virtue of being a super-administrator action.
 */
mediaEngagementRouter.post(
  '/recount',
  requireAuth,
  requirePermission('settings:manage'),
  asyncHandler(async (_req, res) => {
    const totals = await MediaEngagement.aggregate<{
      _id: { targetType: MediaTargetType; targetId: mongoose.Types.ObjectId; action: MediaAction };
      visitorDays: number;
    }>([
      {
        $group: {
          _id: { targetType: '$targetType', targetId: '$targetId', action: '$action' },
          visitorDays: { $sum: 1 },
        },
      },
    ]);

    /**
     * Every record of every tracked type is rewritten, not just the ones with
     * rows.
     *
     * Building `$set` only from the groups that came back would leave a counter
     * whose rows have since been purged sitting at its old value — and the route
     * would report success while the number it claimed to rebuild was never
     * touched. So each type starts from a zeroed set of its supported actions,
     * and the aggregation fills in what it has.
     */
    const zeroed = (targetType: MediaTargetType): Record<string, number> =>
      Object.fromEntries(ALLOWED_ACTIONS[targetType].map((action) => [COUNTER_FIELD[action], 0]));

    const updates = new Map<MediaTargetType, Map<string, Record<string, number>>>();

    for (const targetType of MEDIA_TARGET_TYPES) {
      const model = mongoose.model(MEDIA_TARGET_MODELS[targetType]);
      const ids = await model.find().select('_id').lean();
      updates.set(
        targetType,
        new Map(ids.map((doc) => [String((doc as { _id: unknown })._id), zeroed(targetType)]))
      );
    }

    for (const row of totals) {
      const perType = updates.get(row._id.targetType);
      const fields = perType?.get(String(row._id.targetId));
      // A row whose target has since been hard-deleted has nothing to update.
      if (fields) fields[COUNTER_FIELD[row._id.action]] = row.visitorDays;
    }

    let updated = 0;
    for (const [targetType, perType] of updates) {
      const model = mongoose.model(MEDIA_TARGET_MODELS[targetType]);
      // One bulkWrite per collection: a record with five tracked actions is one
      // update rather than five.
      const operations = [...perType.entries()].map(([id, fields]) => ({
        updateOne: { filter: { _id: id }, update: { $set: fields } },
      }));
      if (operations.length) {
        const result = await model.bulkWrite(operations);
        updated += result.modifiedCount ?? 0;
      }
    }

    ok(res, { recordsUpdated: updated }, 'Counters rebuilt from the engagement log.');
  })
);
