import type { ReactNode } from 'react';

import { requireRole } from '@/lib/auth/session';
import { DashboardShell } from '@/shared/components/dashboard/DashboardShell';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole(ROLES.ADMIN);
  return (
    <DashboardShell
      area="Admin"
      userName={session.user.name}
      roleLabel="Administrator"
      navGroups={[
        { items: [{ label: 'Dashboard', href: '/admin', icon: 'dashboard' }] },
        {
          label: 'Content',
          items: [
            { label: 'Courses', href: '/admin/courses', icon: 'courses' },
            { label: 'Categories', href: '/admin/categories', icon: 'categories' },
            { label: 'Reviews', href: '/admin/reviews', icon: 'reviews' },
          ],
        },
        {
          label: 'Enrollment',
          items: [
            { label: 'Inquiries', href: '/admin/inquiries', icon: 'inquiries' },
            { label: 'Enrollments', href: '/admin/enrollments', icon: 'enrollments' },
            { label: 'Learning paths', href: '/admin/learning-paths', icon: 'paths' },
            { label: 'Payments', href: '/admin/payments', icon: 'payments' },
          ],
        },
        {
          label: 'Cohorts',
          items: [
            { label: 'Batches', href: '/admin/batches', icon: 'batches' },
            { label: 'Learning plans', href: '/admin/learning-plans', icon: 'plans' },
          ],
        },
        {
          label: 'Users',
          items: [
            { label: 'Instructors', href: '/admin/users/instructors', icon: 'instructors' },
            { label: 'Students', href: '/admin/users/students', icon: 'students' },
          ],
        },
        {
          label: 'Platform',
          items: [
            { label: 'Settings', href: '/admin/settings', icon: 'settings' },
            { label: 'Audit log', href: '/admin/audit', icon: 'audit' },
          ],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
