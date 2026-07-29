import { connectDatabase, disconnectDatabase } from '../lib/db'
import { logger } from '../lib/logger'
import { User } from '../models/User'

/**
 * Grants the admin role to an existing account.
 *
 * Deliberately a CLI script rather than an API route: there is no HTTP path to
 * self-promotion, so an account takeover cannot escalate to administrator
 * without separate access to the deployment environment.
 *
 *   npm run promote-admin --workspace=server -- someone@example.com
 */
async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase()

  if (!email) {
    logger.error('Usage: npm run promote-admin --workspace=server -- <email>')
    process.exit(1)
  }

  await connectDatabase()

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { role: 'admin' } },
    { new: true },
  )
    .select('email role')
    .lean()

  if (!user) {
    logger.error('No account found with that email', { email })
    await disconnectDatabase()
    process.exit(1)
  }

  logger.info('Account promoted to administrator', { email: user.email, role: user.role })

  /**
   * Existing refresh sessions are cleared so the change takes effect on the
   * next sign-in rather than lingering behind a stale token.
   */
  await User.updateOne({ email }, { $set: { refreshSessions: [] } })

  await disconnectDatabase()
}

main().catch(async (error: unknown) => {
  logger.error('Promotion failed', {
    error: error instanceof Error ? error.message : String(error),
  })
  await disconnectDatabase()
  process.exit(1)
})
