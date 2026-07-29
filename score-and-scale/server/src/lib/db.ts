import mongoose from 'mongoose'
import { env, readOptional } from './env'
import { logger } from './logger'

let connecting: Promise<typeof mongoose> | null = null

/**
 * Database names that must never be used as the application database.
 *
 * `test` is what the driver silently falls back to when a connection string
 * carries no path segment — the single easiest way to end up writing production
 * data into the wrong place while everything appears to work. `admin`, `local`
 * and `config` are MongoDB's own internal databases.
 */
const RESERVED_DATABASES = new Set(['test', 'admin', 'local', 'config'])

/**
 * Resolves which database to use, without hardcoding its name.
 *
 * Two sources, in order of precedence:
 *   1. MONGODB_DB_NAME, if set — an explicit override, useful when the same
 *      cluster URI serves several environments.
 *   2. The path segment of MONGODB_URI (…mongodb.net/score-and-scale?…).
 *
 * If neither yields a name the connection is refused rather than defaulting.
 * A clear startup failure is far better than a running service quietly
 * populating `test`.
 */
function resolveDatabaseName(uri: string): string {
  const explicit = readOptional('MONGODB_DB_NAME')

  let fromUri: string | undefined
  try {
    // The URL parser handles mongodb:// and mongodb+srv:// fine; the path
    // segment is the database when present.
    const pathname = new URL(uri).pathname.replace(/^\//, '')
    fromUri = pathname ? decodeURIComponent(pathname) : undefined
  } catch {
    throw new Error(
      'MONGODB_URI is not a parsable connection string. Expected something like\n' +
        '  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true',
    )
  }

  const resolved = explicit ?? fromUri

  if (!resolved) {
    throw new Error(
      'No database name could be determined from MONGODB_URI.\n\n' +
        'The connection string has no database path, so the driver would fall back to "test".\n' +
        'Fix it either way:\n' +
        '  - add the database to the URI:  ...mongodb.net/score-and-scale?retryWrites=true\n' +
        '  - or set MONGODB_DB_NAME separately\n\n' +
        'Note that the database name goes BEFORE the query string, not after it.',
    )
  }

  if (RESERVED_DATABASES.has(resolved.toLowerCase())) {
    throw new Error(
      `Refusing to connect to the reserved database "${resolved}".\n\n` +
        (resolved.toLowerCase() === 'test'
          ? 'This is the driver\'s default when a connection string omits its database path, ' +
            'so seeing it here almost always means the name is missing from MONGODB_URI.\n'
          : 'This is one of MongoDB\'s internal databases.\n') +
        'Point MONGODB_URI at the application database, or set MONGODB_DB_NAME.',
    )
  }

  return resolved
}

/**
 * Connects once and reuses the connection. Mongoose buffers commands issued
 * before the handshake completes, so routes can be mounted immediately.
 *
 * Every model in the application shares this single connection, which is what
 * guarantees they all operate against the same database — there is no
 * per-model connection or database name anywhere in the codebase.
 */
export function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose)
  if (connecting) return connecting

  mongoose.set('strictQuery', true)

  // Resolved before connecting so a misconfiguration fails immediately with a
  // useful message rather than after a network timeout.
  const dbName = resolveDatabaseName(env.MONGODB_URI)

  connecting = mongoose
    .connect(env.MONGODB_URI, {
      // Passed explicitly so it wins over whatever the URI implies. Collections
      // are still created on demand by Mongoose as new models are used.
      dbName,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    })
    .then((instance) => {
      // Logged so the connected database is verifiable from the platform logs,
      // rather than being an assumption.
      logger.info('Connected to MongoDB', {
        database: instance.connection.name,
        host: instance.connection.host,
      })

      if (instance.connection.name !== dbName) {
        logger.warn('Connected database does not match the resolved name', {
          resolved: dbName,
          actual: instance.connection.name,
        })
      }

      return instance
    })
    .catch((error: unknown) => {
      connecting = null
      throw error
    })

  return connecting
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
  connecting = null
}
