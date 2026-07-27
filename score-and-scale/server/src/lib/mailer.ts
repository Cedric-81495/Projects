import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendMail({
  to,
  subject,
  html,
}: SendMailOptions): Promise<void> {
  if (!resend) {
    console.warn(
      "[Mailer] RESEND_API_KEY is not configured. Email was skipped.",
      { subject, to }
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: "Score & Scale <no-reply@scoreandscale.com>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[Mailer] Failed to send email:", error);
    throw new Error(error.message);
  }
}