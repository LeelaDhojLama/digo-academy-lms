import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment validation. Import only from server code.
 * Add new server env vars here so misconfiguration fails fast at boot.
 */
const envSchema = z.object({
  /**
   * App / Prisma Client connection. With Supabase, use the transaction pooler
   * (port 6543) and append `?pgbouncer=true`. Local Docker uses the compose URL.
   */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /**
   * Direct Postgres URL for Prisma CLI migrations. Required when DATABASE_URL
   * points at a pooler (Supabase). Optional for local Docker — CLI falls back
   * to DATABASE_URL in prisma.config.ts.
   */
  DIRECT_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  // Google OAuth (optional — social login is enabled only when both are set)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Mandatory MFA for instructors/admins. On by default; set to "false" to relax
  // it in local development. Any value other than "false" keeps it enforced.
  ENFORCE_MFA: z.string().optional(),

  // S3 / object storage (MinIO for local dev, AWS S3 in prod). Uploads are
  // disabled until bucket + credentials are configured.
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  /** Custom endpoint for S3-compatible storage (e.g. http://localhost:9000 for MinIO). */
  S3_ENDPOINT: z.string().optional(),
  /** Path-style addressing — required by MinIO ("true"). */
  S3_FORCE_PATH_STYLE: z.string().optional(),
});

export const env = envSchema.parse(process.env);

/** Google social login is available only when both credentials are configured. */
export const isGoogleAuthEnabled =
  !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;

/** Uploads are available only when a bucket + credentials are configured. */
export const isS3Configured =
  !!env.S3_BUCKET && !!env.S3_ACCESS_KEY_ID && !!env.S3_SECRET_ACCESS_KEY;

/**
 * Whether instructors/admins are forced to enrol MFA before using their dashboard.
 * Enforced unless explicitly disabled (`ENFORCE_MFA=false`), so production stays
 * strict by default and only local dev can opt out.
 */
export const isMfaEnforced = env.ENFORCE_MFA !== 'false';
