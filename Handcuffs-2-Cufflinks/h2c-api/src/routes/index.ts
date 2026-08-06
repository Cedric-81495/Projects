import { Router } from 'express';
import { newsletterRouter } from './newsletter.routes.js';
import { membersRouter } from './members.routes.js';
import { communityRouter } from './community.routes.js';
import { contentRouter } from './content.routes.js';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { meRouter } from './me.routes.js';

/** All API routes, mounted by app.ts under /api. */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter); // Google sign-in for members
apiRouter.use('/me', meRouter); // signed-in member profile + submissions
apiRouter.use('/newsletter', newsletterRouter);
apiRouter.use('/members', membersRouter);
apiRouter.use('/community', communityRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/', contentRouter); // /stories, /episodes, /tracks
