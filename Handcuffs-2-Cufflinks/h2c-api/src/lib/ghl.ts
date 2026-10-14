import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Outbound webhooks to GoHighLevel.
 *
 * The division of labour: this platform owns the signal — who voted, how many,
 * which piece — and GHL owns the sending. Templates, scheduling, bounces and
 * unsubscribes are a solved problem there and a large thing to build here, so
 * we post a payload and stop.
 *
 * Nothing in this file throws. A webhook is a side effect of a visitor's vote,
 * and a vote must never fail because a third party is down, slow, or
 * misconfigured. Failures are logged at warn and the request continues.
 */

/**
 * A member gave or withdrew consent to the movement mailing list.
 *
 * `consent.email: false` is an unsubscribe and should be treated as one.
 */
export interface PreferenceChangedPayload {
  event: 'subscriber.preference_changed';
  sentAt: string;
  email: string;
  consent: { email: boolean; sms: boolean; at: string; source: string };
}

/** Matches the shape agreed with the GHL side. Documented in docs/GHL.md. */
export interface MilestonePayload {
  event: 'apparel.vote_milestone';
  sentAt: string;
  milestone: number;
  piece: {
    id: string;
    name: string;
    slug: string;
    collection: string | null;
    publicUrl: string;
    adminUrl: string;
  };
  engagement: {
    votes: number;
    likes: number;
    favorites: number;
    notifyMeCount: number;
    shares: number;
    views: number;
  };
}

/**
 * Posts a payload to the configured GHL inbound webhook.
 *
 * Returns nothing: callers are not expected to branch on the outcome, and
 * awaiting it would put a third party in the path of a visitor's request.
 */
export type GhlPayload = MilestonePayload | PreferenceChangedPayload;

export async function sendToGhl(payload: GhlPayload): Promise<void> {
  if (!env.GHL_WEBHOOK_URL) {
    /**
     * No URL configured. Logged in full at info rather than dropped silently,
     * so the payload can be read off the server log and handed to the GHL side
     * to build against before the integration is live — the same approach the
     * mailer takes when no Resend key is set.
     */
    logger.info({ ghl: payload }, 'GHL webhook not configured — payload logged, not sent');
    return;
  }

  try {
    /**
     * A short timeout on purpose. This runs after the response has gone back to
     * the visitor, but an unbounded request would hold a socket open against a
     * silent endpoint for as long as the platform allows.
     */
    const response = await fetch(env.GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      logger.warn(
        { status: response.status, event: payload.event },
        'GHL webhook rejected the payload'
      );
      return;
    }

    logger.info({ event: payload.event }, 'GHL webhook delivered');
  } catch (error) {
    logger.warn({ error, event: payload.event }, 'GHL webhook failed');
  }
}
