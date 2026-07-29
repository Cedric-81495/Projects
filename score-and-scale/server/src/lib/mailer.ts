import { Resend } from 'resend'
import { primaryClientOrigin, readOptionalGroup } from './env'
import { logger } from './logger'

let resend: Resend | null = null

function getResend(): { client: Resend; from: string } | null {
  const config = readOptionalGroup(['RESEND_API_KEY'] as const)
  if (!config) return null

  resend ??= new Resend(config.RESEND_API_KEY)

  return {
    client: resend,
    from: process.env.MAIL_FROM ?? 'Score and Scale <noreply@scoreandscale.com>',
  }
}

interface MailInput {
  to: string
  subject: string
  html: string
}

/**
 * Best-effort send.
 *
 * Email is a side effect of a business action, never the action itself — a
 * contact submission is already durably stored before we try to notify anyone.
 * So a mail failure is logged and swallowed rather than turning a successful
 * request into a 500.
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  const configured = getResend()

  if (!configured) {
    logger.warn('Email not sent — RESEND_API_KEY is not configured', { subject: input.subject })
    return false
  }

  try {
    const { error } = await configured.client.emails.send({
      from: configured.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })

    if (error) {
      logger.error('Resend rejected the message', { subject: input.subject, error: error.message })
      return false
    }

    return true
  } catch (error) {
    logger.error('Failed to send email', {
      subject: input.subject,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/** Minimal shared shell so transactional mail matches the product's tone. */
function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:#f6f7f9;padding:32px 16px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#12161c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e6e8ec">
    <tr><td>
      <p style="margin:0 0 24px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280">Score and Scale</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${heading}</h1>
      ${bodyHtml}
      <p style="margin:32px 0 0;font-size:13px;color:#6b7280">
        <a href="${primaryClientOrigin}" style="color:#1a56db;text-decoration:none">${primaryClientOrigin.replace(/^https?:\/\//, '')}</a>
      </p>
    </td></tr>
  </table>
</body></html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendContactAcknowledgement(input: {
  to: string
  name: string
}): Promise<boolean> {
  return sendMail({
    to: input.to,
    subject: 'We received your message',
    html: layout(
      `Thanks, ${escapeHtml(input.name)}.`,
      `<p style="margin:0;font-size:15px;line-height:1.6;color:#374151">
         Your message is with our team and we usually reply within one business day.
       </p>`,
    ),
  })
}

export async function sendContactNotification(input: {
  name: string
  email: string
  topic: string
  message: string
}): Promise<boolean> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!to) {
    logger.warn('ADMIN_NOTIFICATION_EMAIL not set — skipping internal contact notification')
    return false
  }

  return sendMail({
    to,
    subject: `New enquiry — ${input.topic}`,
    html: layout(
      'New contact submission',
      `<p style="margin:0 0 8px;font-size:15px;color:#374151"><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
       <p style="margin:0 0 16px;font-size:15px;color:#374151"><strong>Topic:</strong> ${escapeHtml(input.topic)}</p>
       <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
    ),
  })
}

export async function sendEnrollmentStatusEmail(input: {
  to: string
  name: string
  programName: string
  status: string
}): Promise<boolean> {
  return sendMail({
    to: input.to,
    subject: `Your ${input.programName} enrollment was updated`,
    html: layout(
      'Your enrollment status changed',
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">
         Hi ${escapeHtml(input.name)}, your <strong>${escapeHtml(input.programName)}</strong>
         enrollment is now <strong>${escapeHtml(input.status.replace(/_/g, ' '))}</strong>.
       </p>
       <a href="${primaryClientOrigin}/dashboard"
          style="display:inline-block;background:#12161c;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600">
          View your dashboard
       </a>`,
    ),
  })
}
