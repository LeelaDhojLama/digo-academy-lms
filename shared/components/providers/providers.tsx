'use client';

import type { ReactNode } from 'react';

import { QueryProvider } from './query-provider';

/**
 * Aggregates all client-side providers. Add new global providers here
 * (theme, session, etc.) so the root layout stays clean.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
