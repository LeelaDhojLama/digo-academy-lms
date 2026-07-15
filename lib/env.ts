import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment validation. Import only from server code.
 * Add new server env vars here so misconfiguration fails fast at boot.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);
