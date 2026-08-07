import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '@/config/env';

export const VISITOR_COOKIE = 'h2c_vid';

/**
 * Anonymous visitor identity for apparel engagement.
 *
 * Engagement counts decide which pieces get manufactured, so they have to be
 * deduplicated — otherwise one person with a mouse can decide the next drop.
 * This issues a random opaque id in an httpOnly cookie.
 *
 * It holds no personal data and is not used for analytics or tracking; it
 * exists solely so a like or a vote can be counted once. That is also why IP
 * and user agent are not used for this: they would be more invasive and less
 * accurate.
 */
export const attachVisitor: RequestHandler = (req, res, next) => {
  let id = req.cookies?.[VISITOR_COOKIE] as string | undefined;

  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    id = crypto.randomBytes(18).toString('base64url');
    res.cookie(VISITOR_COOKIE, id, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }

  req.visitorId = id;
  next();
};
