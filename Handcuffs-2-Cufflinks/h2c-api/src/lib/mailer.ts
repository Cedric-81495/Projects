import { env } from '@/config/env';
import { logger } from '@/lib/logger';

/**
 * Outbound email.
 *
 * Deliberately provider-agnostic. Password resets and verification links are
 * security flows, and a security flow that hard-fails because a marketing
 * vendor is down is worse than one that queues. The transport is chosen from
 * the environment at call time:
 *
 *   - `RESEND_API_KEY` set  -> Resend's HTTP API (no SDK, just fetch)
 *   - otherwise             -> the log transport
 *
 * The log transport is not a silent no-op. It writes the full message, link
 * included, at warn level so a developer running locally can copy the link out
 * of the terminal, and so a misconfigured production deploy is loud rather than
 * quietly dropping every reset request.
 *
 * Nothing here throws. Callers must not branch on delivery success: telling an
 * anonymous caller that their reset email failed also tells them the address is
 * registered.
 */

export interface Mail {
  to: string;
  subject: string;
  /** Plain text. Every message must have it — some clients render nothing else. */
  text: string;
  html?: string;
}

type Transport = (mail: Mail) => Promise<void>;

const logTransport: Transport = async (mail) => {
  logger.warn(
    { to: mail.to, subject: mail.subject, body: mail.text },
    'email not sent — no mail transport configured. Body logged in full.'
  );
};

const resendTransport: Transport = async (mail) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY!}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      ...(mail.html ? { html: mail.html } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
  }
};

function transport(): Transport {
  return env.RESEND_API_KEY ? resendTransport : logTransport;
}

/**
 * Sends a message, swallowing transport failures.
 *
 * Resolves either way. A delivery failure is logged at error level with the
 * recipient, so the outage is visible in the platform logs without the caller
 * having to decide what to do about it mid-request.
 */
export async function sendMail(mail: Mail): Promise<void> {
  try {
    await transport()(mail);
  } catch (error) {
    logger.error({ error, to: mail.to, subject: mail.subject }, 'email delivery failed');
  }
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

/**
 * The voice here matters as much as anywhere else on the site. These are often
 * the first direct message someone gets from the movement, so they read like a
 * person wrote them rather than a mail server.
 */

const signOff = `— Handcuffs 2 Cufflinks\nFrom Struggle to Success`;

export function passwordResetMail(to: string, name: string, link: string, ttlMinutes: number): Mail {
  return {
    to,
    subject: 'Reset your Handcuffs 2 Cufflinks password',
    text: [
      `Hi ${name},`,
      '',
      'Someone asked to reset the password on your Handcuffs 2 Cufflinks account.',
      'If that was you, open this link within the next ' + ttlMinutes + ' minutes:',
      '',
      link,
      '',
      'If it was not you, you can ignore this message — nothing has changed, and',
      'your current password still works.',
      '',
      signOff,
    ].join('\n'),
  };
}

export function verifyEmailMail(to: string, name: string, link: string): Mail {
  return {
    to,
    subject: 'Confirm your email address',
    text: [
      `Hi ${name},`,
      '',
      'Confirm this address so we know we can reach you:',
      '',
      link,
      '',
      'The link is good for 24 hours.',
      '',
      signOff,
    ].join('\n'),
  };
}

export function passwordChangedMail(to: string, name: string): Mail {
  return {
    to,
    subject: 'Your password was changed',
    text: [
      `Hi ${name},`,
      '',
      'The password on your Handcuffs 2 Cufflinks account was just changed, and',
      'every other signed-in session was ended.',
      '',
      'If this was not you, reply to this message straight away.',
      '',
      signOff,
    ].join('\n'),
  };
}

export function mfaEnabledMail(to: string, name: string): Mail {
  return {
    to,
    subject: 'Two-step verification is on',
    text: [
      `Hi ${name},`,
      '',
      'Two-step verification is now switched on for your account. From now on',
      'signing in needs your password and a code from your authenticator app.',
      '',
      'Keep your recovery codes somewhere safe — they are the way back in if you',
      'lose the phone.',
      '',
      signOff,
    ].join('\n'),
  };
}
