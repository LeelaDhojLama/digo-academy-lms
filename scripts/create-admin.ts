import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';

import { PrismaClient } from '../lib/generated/prisma/client';

/**
 * Bootstrap an ADMIN account. Admins are never self-registerable through the app
 * (role is `input:false` in the Better Auth config), so the first admin has to be
 * created out of band. Idempotent: an existing user is promoted to ADMIN.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='min-8-chars' ADMIN_NAME='Your Name' \
 *     npm run db:create-admin
 *
 * The account is created pre-verified. Because admins are MFA-required, the first
 * login redirects to /settings/security to enrol a second factor.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Admin';
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }
  if (!connectionString) {
    throw new Error('DATABASE_URL (or DIRECT_URL) is not set.');
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const existing = await db.user.findUnique({
      where: { email },
      include: { accounts: { where: { providerId: 'credential' } } },
    });

    if (existing) {
      await db.user.update({
        where: { email },
        data: { role: 'ADMIN', emailVerified: true },
      });
      // Give a credential login if the account only had social sign-in before.
      if (existing.accounts.length === 0) {
        await db.account.create({
          data: {
            providerId: 'credential',
            accountId: existing.id,
            userId: existing.id,
            password: await hashPassword(password),
          },
        });
      }
      console.info(`✔ Promoted existing user ${email} to ADMIN.`);
      return;
    }

    const user = await db.user.create({
      data: { name, email, role: 'ADMIN', emailVerified: true },
    });
    await db.account.create({
      data: {
        providerId: 'credential',
        accountId: user.id,
        userId: user.id,
        password: await hashPassword(password),
      },
    });
    console.info(`✔ Created admin ${email}. Sign in, then enrol MFA when prompted.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
