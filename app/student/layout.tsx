import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { ROLES } from '@/shared/constants/roles';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(ROLES.STUDENT);
  return (
    <DashboardShell
      area="Student"
      userName={session.user.name}
      roleLabel="Student"
      navGroups={[
        { items: [{ label: 'Dashboard', href: '/student', icon: 'dashboard' }] },
        {
          label: 'Learning',
          items: [
            { label: 'Browse', href: '/student/courses', icon: 'courses' },
            { label: 'Live classes', href: '/student/live', icon: 'live' },
            { label: 'Wishlist', href: '/student/wishlist', icon: 'wishlist' },
            { label: 'Inquiries', href: '/student/inquiries', icon: 'inquiries' },
          ],
        },
        {
          label: 'Account',
          items: [{ label: 'Profile', href: '/student/profile', icon: 'profile' }],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
