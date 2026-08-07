import { Router } from 'express';
import mongoose from 'mongoose';
import { ok } from '@/lib/envelope';
import { attachVisitor } from '@/middleware/visitor';
import { analyticsRouter } from '@/modules/analytics';
import { authRouter } from '@/modules/auth/auth.controller';
import { communityRouter } from '@/modules/community';
import { contentRouter } from '@/modules/content';
import { engagementRouter } from '@/modules/engagement';
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

apiRouter.use('/auth', authRouter);

// Engagement needs the anonymous visitor cookie for deduplication.
apiRouter.use('/apparel', attachVisitor, engagementRouter);

apiRouter.use(contentRouter);
apiRouter.use('/community', communityRouter);
apiRouter.use('/subscribers', subscriberRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/analytics', analyticsRouter);

apiRouter.get('/', (_req, res) => {
  ok(res, { name: 'Handcuffs 2 Cufflinks API', version: 'v1' });
});
