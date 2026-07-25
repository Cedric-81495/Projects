import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping email send:', opts.subject);
    return;
  }
  await resend.emails.send({
    from: 'Score & Scale <no-reply@scoreandscale.com>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
