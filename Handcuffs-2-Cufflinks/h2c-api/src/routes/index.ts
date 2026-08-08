import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '@/lib/envelope';
import { attachVisitor } from '@/middleware/visitor';
import { analyticsRouter } from '@/modules/analytics';
import { authRouter } from '@/modules/auth/auth.controller';
import { communityRouter } from '@/modules/community';
import { contentRouter } from '@/modules/content';
import { memberRouter } from '@/modules/members/member.controller';
import { engagementRouter } from '@/modules/engagement';
import { mediaEngagementRouter } from '@/modules/media-engagement';
import { siteRouter } from '@/modules/site';
import { subscriberRouter } from '@/modules/subscribers';
import { userRouter } from '@/modules/users';

export const apiRouter = Router();

/**
 * Health check for Render. Reports database state separately from process
 * state: a server that is running but cannot reach Mongo is not healthy, and
 * returning 200 for it would hide the outage from the platform.
 */
apiRouter.get('/health', (_req, res) => {
  // readyState can also be 99 (uninitialized), which is outside the named set.
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbState = states[mongoose.connection.readyState] ?? 'unknown';
  const healthy = mongoose.connection.readyState === 1;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: { status: healthy ? 'ok' : 'degraded', database: dbState, uptimeSeconds: Math.round(process.uptime()) },
  });
});

// Staff CMS authentication.
apiRouter.use('/auth', authRouter);

// Public community accounts. Entirely separate from /auth — different
// collection, different token audience, no permissions.
apiRouter.use('/members', memberRouter);

// Engagement needs the anonymous visitor cookie for deduplication.
apiRouter.use('/apparel', attachVisitor, engagementRouter);

// Site chrome, structure, and metadata: announcements, hero banners, the
// homepage layout, navigation, standing pages, and SEO.
apiRouter.use('/site', siteRouter);

// Music, docuseries, and podcast interactions. Same anonymous visitor cookie
// as apparel, so a play can be deduplicated without an account.
apiRouter.use('/media-engagement', attachVisitor, mediaEngagementRouter);

apiRouter.use(contentRouter);
apiRouter.use('/community', communityRouter);
apiRouter.use('/subscribers', subscriberRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/analytics', analyticsRouter);

apiRouter.get('/', (_req, res) => {
  ok(res, { name: 'Handcuffs 2 Cufflinks API', version: 'v1' });
});
