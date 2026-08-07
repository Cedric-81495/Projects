import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env } from '@/config/env';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalLimiter } from '@/middleware/rateLimit';
import { apiRouter } from '@/routes';

export function createApp() {
  const app = express();

  /**
   * Render terminates TLS at its proxy, so without this req.ip is the proxy's
   * address — which would make every rate limiter treat all traffic as one
   * client, and secure cookies would not be set.
   */
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    // The API serves JSON, not documents, so the browser-facing directives are
    // the frontend host's responsibility.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  /**
   * Credentialed CORS with an explicit allowlist. A wildcard origin is not an
   * option here: the refresh token is a cookie, and browsers reject `*` with
   * credentials — correctly, since it would let any site call the API as the
   * signed-in admin.
   */
  app.use(cors({
    origin(origin, callback) {
      // Same-origin, curl, and server-to-server calls send no Origin header.
      if (!origin) return callback(null, true);
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      logger.warn({ origin }, 'blocked cross-origin request');
      callback(new ApiError(403, 'Origin not allowed.', { code: 'CORS_BLOCKED' }));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }));

  // 1MB is generous for JSON content and small enough that a large body cannot
  // be used to exhaust memory. File uploads get their own route and limits.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(compression());
  app.use(hpp());

  app.use(pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
  }));

  app.use('/api/v1', generalLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
