import { Router } from 'express';
import { asyncHandler } from '@/lib/asyncHandler';
import { ok } from '@/lib/envelope';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { CommunityStory } from '@/models/community';
import { ApparelItem, DocuseriesEpisode, MusicRelease, PodcastEpisode } from '@/models/content';
import { MediaEngagement, dayKeyFor } from '@/models/mediaEngagement';
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
      mediaTotals,
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
      /**
       * Media engagement over the same trailing window as subscriber growth.
       *
       * Read from the MediaEngagement rows rather than the denormalised
       * counters on each record, because the counters are lifetime totals and
       * the question a dashboard is asked is how things are going lately. One
       * row is one visitor-day, so counting rows counts reach and summing
       * occurrences counts volume — both are shown, because a hundred plays
       * from four people is a different story from a hundred from ninety.
       */
      MediaEngagement.aggregate<{ _id: { targetType: string; action: string }; visitorDays: number; occurrences: number }>([
        { $match: { dayKey: { $gte: dayKeyFor(thirtyDaysAgo) } } },
        {
          $group: {
            _id: { targetType: '$targetType', action: '$action' },
            visitorDays: { $sum: 1 },
            occurrences: { $sum: '$occurrences' },
          },
        },
      ]),
    ]);

    const apparel = apparelTotals[0] ?? { likes: 0, votes: 0, favorites: 0, notifyMe: 0, shares: 0 };

    /** Pulls one figure out of the grouped media rows, defaulting to zero. */
    const media = (targetType: string, action: string) =>
      mediaTotals.find((row) => row._id.targetType === targetType && row._id.action === action) ?? {
        visitorDays: 0,
        occurrences: 0,
      };

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
      /**
       * The KPIs the guide names: music plays, docuseries engagement, podcast
       * views. `reach` is distinct visitor-days; `total` counts repeats.
       *
       * The window is stated in the payload rather than assumed by the client.
       * A number labelled only "plays" invites being read as all-time, and the
       * difference matters when someone is deciding whether a release worked.
       */
      media: {
        windowDays: 30,
        music: {
          plays: { reach: media('music-release', 'play').visitorDays, total: media('music-release', 'play').occurrences },
          views: { reach: media('music-release', 'view').visitorDays, total: media('music-release', 'view').occurrences },
          downloads: { reach: media('music-release', 'download').visitorDays, total: media('music-release', 'download').occurrences },
        },
        docuseries: {
          views: { reach: media('docuseries-episode', 'view').visitorDays, total: media('docuseries-episode', 'view').occurrences },
          plays: { reach: media('docuseries-episode', 'play').visitorDays, total: media('docuseries-episode', 'play').occurrences },
          completions: { reach: media('docuseries-episode', 'complete').visitorDays, total: media('docuseries-episode', 'complete').occurrences },
        },
        podcast: {
          views: { reach: media('podcast-episode', 'view').visitorDays, total: media('podcast-episode', 'view').occurrences },
          plays: { reach: media('podcast-episode', 'play').visitorDays, total: media('podcast-episode', 'play').occurrences },
          clipPlays: { reach: media('podcast-clip', 'play').visitorDays, total: media('podcast-clip', 'play').occurrences },
        },
      },
    });
  })
);
