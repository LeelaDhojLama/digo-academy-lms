import 'dotenv/config';

import {
  GetAccountCommand,
  ListEmailIdentitiesCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2';

/**
 * Diagnose AWS SES email setup from the terminal: lists verified identities,
 * shows sandbox / production status, and checks whether EMAIL_FROM can send.
 *
 * Standalone (can't import server-only lib/email) — builds its own SES client
 * from the SES_* env vars, same pattern as prisma/seed.ts.
 *
 *   npm run email:check
 */

const region = process.env['SES_REGION'];
const from = process.env['EMAIL_FROM'] ?? '';
const accessKeyId = process.env['SES_ACCESS_KEY_ID'];
const secretAccessKey = process.env['SES_SECRET_ACCESS_KEY'];

/** Extract the bare address from "Name <email>" or a plain address. */
function parseAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

async function main() {
  if (!region) {
    console.log(
      'SES_REGION is not set — email runs in dev mode (messages log to the server console).\n' +
        'Set SES_REGION (and EMAIL_FROM to a verified identity) to send via AWS SES.'
    );
    return;
  }

  const client = new SESv2Client({
    region,
    credentials:
      accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });

  const fromAddress = parseAddress(from);
  const fromDomain = fromAddress.includes('@') ? fromAddress.split('@')[1] : '';

  console.log(`\nSES region:   ${region}`);
  console.log(`EMAIL_FROM:   ${from || '(unset)'}  ->  ${fromAddress || '(none)'}`);

  const isAccessDenied = (error: unknown) =>
    (error as { name?: string })?.name === 'AccessDeniedException' ||
    /not authorized|AccessDenied/i.test((error as Error)?.message ?? '');

  let readDenied = false;

  // Account / sandbox status
  try {
    const account = await client.send(new GetAccountCommand({}));
    const sandbox = account.ProductionAccessEnabled ? 'PRODUCTION' : 'SANDBOX (verified recipients only)';
    console.log(`\nAccount:      ${sandbox}`);
    console.log(`Sending:      ${account.SendingEnabled ? 'enabled' : 'DISABLED'}`);
    if (account.SendQuota) {
      console.log(
        `Quota:        ${account.SendQuota.SentLast24Hours ?? 0} / ${account.SendQuota.Max24HourSend ?? 0} in last 24h`
      );
    }
  } catch (error) {
    if (isAccessDenied(error)) readDenied = true;
    else console.error('\nCould not read account status:', (error as Error).message);
  }

  // Verified identities
  const identities: { name: string; type?: string; verified?: boolean }[] = [];
  let listedOk = false;
  try {
    let nextToken: string | undefined;
    do {
      const res = await client.send(
        new ListEmailIdentitiesCommand({ NextToken: nextToken, PageSize: 100 })
      );
      for (const id of res.EmailIdentities ?? []) {
        identities.push({
          name: id.IdentityName ?? '',
          type: id.IdentityType,
          verified: id.VerifiedForSendingStatus,
        });
      }
      nextToken = res.NextToken;
    } while (nextToken);
    listedOk = true;
  } catch (error) {
    if (isAccessDenied(error)) readDenied = true;
    else console.error('\nCould not list identities:', (error as Error).message);
  }

  if (readDenied) {
    console.log(
      '\n⚠️  This IAM user can send but not read SES config (no ses:GetAccount / ses:ListEmailIdentities).\n' +
        '    Credentials & region are valid. To use this diagnostic, attach a read policy such as:\n' +
        '      { "Effect": "Allow", "Action": ["ses:GetAccount","ses:ListEmailIdentities","ses:GetEmailIdentity"], "Resource": "*" }\n' +
        `    Otherwise verify "${fromAddress}" (or domain "${fromDomain}") in the SES console → region ${region}.`
    );
    return; // unknown, not a definitive failure
  }

  console.log(`\nVerified identities (${identities.length}):`);
  if (identities.length === 0) {
    console.log('  (none — verify a domain or email address in the SES console)');
  } else {
    for (const id of identities) {
      console.log(`  ${id.verified ? '✅' : '❌'}  ${id.name}  [${id.type ?? '?'}]`);
    }
  }

  if (!listedOk) return;

  // Can EMAIL_FROM send?
  const canSend = identities.some(
    (id) => id.verified && (id.name.toLowerCase() === fromAddress || id.name.toLowerCase() === fromDomain)
  );
  console.log(
    `\nCan send as ${fromAddress || '(unset)'}:  ${canSend ? '✅ yes' : '❌ no — verify this address or its domain in ' + region}`
  );
  if (!canSend) process.exitCode = 1;
}

main().catch((error) => {
  console.error('email:check failed:', error);
  process.exitCode = 1;
});
