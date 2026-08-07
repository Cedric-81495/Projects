import dns from 'node:dns';
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

/**
 * Points Node's resolver at the configured servers.
 *
 * Only affects dns.resolve*() — which is what the MongoDB driver uses for the
 * SRV and TXT lookups behind mongodb+srv:// — and not dns.lookup(), which the
 * OS handles. That is exactly the split we need: resolvers that refuse SRV
 * queries almost always serve ordinary A records without complaint, so the
 * subsequent connections keep working through the system resolver.
 */
function applyDnsOverride(): void {
  if (env.dnsServers.length === 0) return;
  try {
    dns.setServers(env.dnsServers);
    logger.info({ servers: env.dnsServers }, 'dns resolver overridden for this process');
  } catch (error) {
    logger.warn({ error, servers: env.dnsServers }, 'invalid DNS_SERVERS value — using system resolver');
  }
}

/** Turns the cryptic SRV failure into something actionable. */
function explainConnectionError(error: unknown): Error {
  const err = error as { syscall?: string; code?: string; message?: string };

  if (err.syscall === 'querySrv') {
    return new Error(
      'Could not resolve the MongoDB SRV record. Your DNS resolver is refusing SRV ' +
        'queries — common on some routers, corporate networks, and VPNs.\n\n' +
        'Fix it in one of three ways:\n' +
        '  1. Set DNS_SERVERS=8.8.8.8,1.1.1.1 in .env (works for this process only)\n' +
        '  2. Disconnect from any VPN and retry\n' +
        '  3. Use the non-SRV connection string from Atlas:\n' +
        '     Connect -> Drivers -> "Node.js 2.2.12 or later" gives a mongodb:// URI\n' +
        '     with explicit hosts and no SRV lookup at all.\n\n' +
        `Original error: ${err.message ?? String(error)}`
    );
  }

  if (err.message?.includes('ETIMEDOUT') || err.message?.includes('ServerSelectionError')) {
    return new Error(
      'Reached DNS but could not connect to the cluster. Check that your IP is ' +
        'allowed under Atlas -> Network Access, and that the username and password ' +
        'in MONGODB_URI are correct and URL-encoded.\n\n' +
        `Original error: ${err.message ?? String(error)}`
    );
  }

  return error as Error;
}

export async function connectDatabase(): Promise<void> {
  applyDnsOverride();

  mongoose.connection.on('connected', () => logger.info('mongodb connected'));
  mongoose.connection.on('disconnected', () => logger.warn('mongodb disconnected'));
  mongoose.connection.on('error', (error) => logger.error({ error }, 'mongodb error'));

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
      autoIndex: !env.isProduction,
    });
  } catch (error) {
    throw explainConnectionError(error);
  }

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

/**
 * Connection for CLI scripts (seed, create-admin, verify-db).
 *
 * Shares the DNS override and the error translation with the server. Without
 * this the scripts would call mongoose.connect directly and reproduce the raw
 * `querySrv ECONNREFUSED`, which is the least helpful moment to see it — these
 * are the first commands anyone runs on a new machine.
 */
export async function connectForScript(): Promise<void> {
  applyDnsOverride();
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });
  } catch (error) {
    throw explainConnectionError(error);
  }
}
