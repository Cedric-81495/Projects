import pino from 'pino';
import { env } from '@/config/env';

/**
 * Structured logging.
 *
 * The redact list is not decoration: request bodies and headers routinely carry
 * passwords, tokens, and cookies, and logs are the most common way those end up
 * somewhere they should not be.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (env.isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      '*.password',
    ],
    censor: '[redacted]',
  },
  transport: env.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});
