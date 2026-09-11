import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { STUDENT_NAV_GROUPS } from '@/shared/constants/nav';
import { ROLES } from '@/shared/constants/roles';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(ROLES.STUDENT);
  return (
    <DashboardShell
      area="Student"
      userName={session.user.name}
      roleLabel="Student"
      navGroups={STUDENT_NAV_GROUPS}
    >
      {children}
    </DashboardShell>
  );
}
