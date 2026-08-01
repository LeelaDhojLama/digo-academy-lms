import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/lib/generated/prisma/client';
import { env } from '@/lib/env';

/**
 * Single PrismaClient instance. In dev, reuse across HMR reloads to avoid
 * exhausting database connections.
 *
 * Prisma 7 requires a driver adapter; we use node-postgres with DATABASE_URL.
 * On Supabase, DATABASE_URL should be the transaction pooler (`?pgbouncer=true`).
 * Migrations use DIRECT_URL via prisma.config.ts — not this client.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
