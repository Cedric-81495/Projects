import mongoose from 'mongoose';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

/**
 * Database connection.
 *
 * strictQuery keeps a typo in a filter from silently matching every document —
 * which is the difference between "no results" and "deleted everything".
 */
mongoose.set('strictQuery', true);

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('mongodb connected'));
  mongoose.connection.on('disconnected', () => logger.warn('mongodb disconnected'));
  mongoose.connection.on('error', (error) => logger.error({ error }, 'mongodb error'));

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    autoIndex: !env.isProduction,
  });

  /**
   * Indexes are built explicitly in production rather than on every boot.
   * autoIndex on a large collection blocks startup and can take a deployment
   * down; `npm run seed` and the migration path handle it deliberately.
   */
  if (env.isProduction) {
    logger.info('autoIndex disabled — run index sync as a deliberate step');
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}
