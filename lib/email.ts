import 'server-only';

import { Resend } from 'resend';

import { env } from '@/lib/env';

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain-text body (fallback for clients that don't render HTML). */
  text: string;
  /** Optional HTML body — preferred by clients when present. */
  html?: string;
}

/** Whether a real email provider is configured. */
export const isEmailConfigured = Boolean(env.RESEND_API_KEY);

let resendClient: Resend | null = null;
function getResend(): Resend {
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

/**
 * Transactional email sender.
 *
 * - If RESEND_API_KEY is set, sends via Resend (production path).
 * - Otherwise, in development it logs the message (including any verification /
 *   reset link) to the server console.
 * - In production with no provider it throws, so misconfiguration fails loudly
 *   rather than silently dropping mail.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  if (isEmailConfigured) {
    const { error } = await getResend().emails.send(
      html
        ? { from: env.EMAIL_FROM, to, subject, html, text }
        : { from: env.EMAIL_FROM, to, subject, text }
    );
    if (error) throw new Error(`Email send failed: ${error.message}`);
    return;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'No email provider configured. Set RESEND_API_KEY (and EMAIL_FROM) before production.'
    );
  }

  console.info(
    ['', '📧  [dev email]', `  to:      ${to}`, `  subject: ${subject}`, `  body:    ${text}`, ''].join(
      '\n'
    )
  );
}
