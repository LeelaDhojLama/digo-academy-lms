import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '@/lib/generated/prisma/client';
import { env } from '@/lib/env';

/**
 * Single PrismaClient instance, reused across HMR (dev) and warm serverless
 * isolates (prod) to avoid opening a new pool per import.
 *
 * Supabase free/session pooler caps ~15 clients. Use the *transaction* pooler
 * for DATABASE_URL (port 6543 + `?pgbouncer=true`) and keep this pool tiny.
 * Migrations still use DIRECT_URL (session/direct) via prisma.config.ts.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function createPrismaClient() {
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: env.DATABASE_URL,
      // Serverless / Next workers: one client per isolate is enough and stays
      // under Supabase's session/transaction pool limits.
      max: 1,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = db;
