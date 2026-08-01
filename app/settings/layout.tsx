import type { ReactNode } from 'react';

import { requireUser } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  return (
    <DashboardShell area="Settings" userName={session.user.name}>
      {children}
    </DashboardShell>
  );
}
