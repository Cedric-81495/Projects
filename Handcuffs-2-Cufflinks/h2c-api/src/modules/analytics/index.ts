import { Router } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { ok } from '@/lib/envelope';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { CommunityStory } from '@/models/community';
import { ApparelItem, DocuseriesEpisode, MusicRelease, PodcastEpisode } from '@/models/content';
import { Subscriber } from '@/models/Subscriber';

/**
 * Reporting dashboard.
 *
 * Success on this platform is community growth, not sales, so subscribers and
 * engagement lead. Apparel figures are here to answer one question: what should
 * we make next.
 */
export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, requirePermission('analytics:read'));

analyticsRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      subscribers,
      subscribersRecent,
      storiesPending,
      storiesPublished,
      apparelTotals,
      docuseriesCount,
      podcastCount,
      releaseCount,
    ] = await Promise.all([
      Subscriber.countDocuments({ status: 'subscribed' }),
      Subscriber.countDocuments({ status: 'subscribed', createdAt: { $gte: thirtyDaysAgo } }),
      CommunityStory.countDocuments({ 'moderation.state': 'pending' }),
      CommunityStory.countDocuments({ status: 'published' }),
      ApparelItem.aggregate([
        { $match: { status: 'published' } },
        {
          $group: {
            _id: null,
            likes: { $sum: '$engagement.likes' },
            votes: { $sum: '$engagement.votes' },
            favorites: { $sum: '$engagement.favorites' },
            notifyMe: { $sum: '$engagement.notifyMeCount' },
            shares: { $sum: '$engagement.shares' },
          },
        },
      ]),
      DocuseriesEpisode.countDocuments({ status: 'published' }),
      PodcastEpisode.countDocuments({ status: 'published' }),
      MusicRelease.countDocuments({ status: 'published' }),
    ]);

    const apparel = apparelTotals[0] ?? { likes: 0, votes: 0, favorites: 0, notifyMe: 0, shares: 0 };

    ok(res, {
      movement: {
        subscribers,
        subscribersLast30Days: subscribersRecent,
      },
      apparel: {
        likes: apparel.likes,
        votes: apparel.votes,
        favorites: apparel.favorites,
        notifyMe: apparel.notifyMe,
        shares: apparel.shares,
      },
      community: {
        storiesAwaitingReview: storiesPending,
        storiesPublished,
      },
      content: {
        docuseriesEpisodes: docuseriesCount,
        podcastEpisodes: podcastCount,
        musicReleases: releaseCount,
      },
    });
  })
);
