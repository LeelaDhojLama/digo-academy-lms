import type { ReactNode } from 'react';

import { PublicFooter } from '@/shared/components/public/PublicFooter';
import { PublicHeader } from '@/shared/components/public/PublicHeader';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
