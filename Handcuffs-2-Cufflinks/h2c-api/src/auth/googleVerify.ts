import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  emailVerified: boolean;
};

/**
 * Verify a Google ID token (from Google Identity Services on the frontend).
 * Confirms the signature, audience (our client ID), and expiry before we trust
 * any of its claims. Throws a 401 on any problem.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new HttpError(401, 'Google sign-in could not be verified. Please try again.');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new HttpError(401, 'Google account is missing required information.');
  }
  if (payload.email_verified === false) {
    throw new HttpError(403, 'Please verify your email with Google before signing in.');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split('@')[0],
    avatar: payload.picture || '',
    emailVerified: payload.email_verified ?? false,
  };
}
