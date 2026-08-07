import { createApp } from '@/app';
import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/db/connect';
import { flushRebuild } from '@/lib/deployHook';
import { logger } from '@/lib/logger';

async function start(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, cors: env.corsOrigins },
      'Handcuffs 2 Cufflinks API listening'
    );
  });

  /**
   * Graceful shutdown. Render sends SIGTERM on deploy; without this, in-flight
   * requests are cut off mid-response and a queued site rebuild is lost.
   */
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    flushRebuild();

    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });

    // Backstop: never hang a deploy waiting on a stuck connection.
    setTimeout(() => {
      logger.error('forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandled promise rejection');
  process.exit(1);
});

start().catch((error: unknown) => {
  logger.fatal({ error }, 'failed to start');
  process.exit(1);
});
