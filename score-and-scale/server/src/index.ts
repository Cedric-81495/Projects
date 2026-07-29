import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { connectDatabase } from './lib/db'
import { env } from './lib/env'
import { logger } from './lib/logger'
import { isBraintreeConfigured } from './lib/braintree'
import { isGoogleOAuthConfigured } from './lib/googleOAuth'
import { isStorageConfigured } from './lib/storage'
import { requireCsrf, CSRF_HEADER } from './middleware/csrf'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { globalLimiter } from './middleware/rateLimit'
import academyRouter from './routes/academy.routes'
import adminRouter from './routes/admin.routes'
import authRouter from './routes/auth.routes'
import checkoutRouter from './routes/checkout.routes'
import contactRouter from './routes/contact.routes'
import documentsRouter from './routes/documents.routes'
import enrollmentsRouter from './routes/enrollments.routes'
import notificationsRouter from './routes/notifications.routes'
import paymentsRouter from './routes/payments.routes'
import programsRouter from './routes/programs.routes'
import webhooksRouter from './routes/webhooks.routes'

const app = express()

/**
 * Render terminates TLS at a reverse proxy. Without this, req.ip is the
 * proxy's address for every request — which would make the rate limiter treat
 * all traffic as one client — and req.secure would be false, breaking the
 * Secure cookie logic.
 */
app.set('trust proxy', 1)
app.disable('x-powered-by')

/**
 * The API serves JSON to a separate frontend origin and never renders HTML, so
 * the CSP can be maximally restrictive: nothing is allowed to load or execute
 * from a response here. The frontend ships its own policy via netlify.toml.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    // Cross-origin reads are governed by the CORS allowlist below.
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: env.isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  }),
)

/**
 * Strict origin allowlist with credentials enabled.
 *
 * `credentials: true` is required for the session cookies, and the CORS spec
 * forbids pairing that with a wildcard origin — so unknown origins are rejected
 * rather than reflected. Requests without an Origin header (server-to-server,
 * health checks, Braintree webhooks) are allowed through, since CSRF is a
 * browser-only concern and those callers carry no ambient cookies.
 */
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin.replace(/\/$/, ''))) {
        callback(null, true)
        return
      }
      logger.warn('Blocked a cross-origin request from an unknown origin', { origin })
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', CSRF_HEADER],
    maxAge: 86_400,
  }),
)

/**
 * Webhooks are mounted before the JSON body parser: Braintree posts
 * form-encoded data whose raw bytes are needed to verify the signature, and
 * express.json() would consume the stream first.
 */
app.use('/api/webhooks', webhooksRouter)

app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    integrations: {
      braintree: isBraintreeConfigured(),
      storage: isStorageConfigured(),
      email: Boolean(process.env.RESEND_API_KEY),
      // True only when the client id, secret, and callback URL are all present —
      // the code flow needs all three, so a partial config must not read as ready.
      googleOAuth: isGoogleOAuthConfigured(),
    },
  })
})

app.use('/api', globalLimiter)

/**
 * CSRF runs after cookieParser and before every mutating route. It is a no-op
 * for safe methods and for callers with no session cookie.
 */
app.use('/api', requireCsrf)

app.use('/api/auth', authRouter)
app.use('/api/programs', programsRouter)
app.use('/api/contact', contactRouter)
app.use('/api/enrollments', enrollmentsRouter)
app.use('/api/checkout', checkoutRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/academy', academyRouter)
app.use('/api/admin', adminRouter)

app.use(notFoundHandler)
app.use(errorHandler)

async function start(): Promise<void> {
  await connectDatabase()

  app.listen(env.PORT, () => {
    logger.info('API listening', {
      port: env.PORT,
      nodeEnv: env.NODE_ENV,
      // Confirms the production cookie policy is active in Render's logs.
      crossSiteCookies: env.isProduction,
      allowedOrigins: env.clientUrls,
    })
  })
}

start().catch((error: unknown) => {
  logger.error('Failed to start the API', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
})

export { app }
