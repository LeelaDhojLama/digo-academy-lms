import 'server-only';

import { env } from '@/lib/env';

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain-text body. Rich templates arrive with the notifications phase. */
  text: string;
}

/**
 * Transactional email sender.
 *
 * There is no email provider wired up yet (that lands with notifications later),
 * so in development this logs the message — including any verification/reset link —
 * to the server console. In production a real provider must be configured; until
 * then we fail loudly rather than silently drop mail.
 */
export async function sendEmail({ to, subject, text }: SendEmailInput): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'No email provider configured. Wire up a transactional email provider before production.'
    );
  }

  console.info(
    ['', '📧  [dev email]', `  to:      ${to}`, `  subject: ${subject}`, `  body:    ${text}`, ''].join(
      '\n'
    )
  );
}
