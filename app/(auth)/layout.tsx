import Link from 'next/link';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 flex-col items-center justify-center gap-8 bg-muted/40 p-4">
      <Link href="/" aria-label="Digo Academy home">
        <BrandLogo className="h-9" />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
