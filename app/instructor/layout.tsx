import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { ROLES } from '@/shared/constants/roles';

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(ROLES.INSTRUCTOR);
  return (
    <DashboardShell
      area="Instructor"
      userName={session.user.name}
      roleLabel="Instructor"
      navGroups={[
        { items: [{ label: 'Dashboard', href: '/instructor', icon: 'dashboard' }] },
        {
          label: 'Teaching',
          items: [{ label: 'Courses', href: '/instructor/courses', icon: 'courses' }],
        },
        {
          label: 'Account',
          items: [{ label: 'Profile', href: '/instructor/profile', icon: 'profile' }],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
