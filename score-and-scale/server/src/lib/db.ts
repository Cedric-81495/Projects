import mongoose from 'mongoose'
import { env } from './env'
import { logger } from './logger'

let connecting: Promise<typeof mongoose> | null = null

/**
 * Connects once and reuses the connection. Mongoose buffers commands issued
 * before the handshake completes, so routes can be mounted immediately.
 */
export function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose)
  if (connecting) return connecting

  mongoose.set('strictQuery', true)

  connecting = mongoose
    .connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    })
    .then((instance) => {
      logger.info('Connected to MongoDB', { database: instance.connection.name })
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
