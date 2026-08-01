import Link from 'next/link';

import { CreateInstructorForm } from '@/features/users/components/CreateInstructorForm';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Panel } from '@/shared/components/dashboard/Panel';
import { ROLES } from '@/shared/constants/roles';

export default async function NewInstructorPage() {
  await requireRole(ROLES.ADMIN);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/admin/users/instructors"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Back to instructors
      </Link>

      <PageHeader
        title="Add instructor"
        description="Create an instructor account. They can author and manage courses once signed in."
      />

      <Panel>
        <CreateInstructorForm />
      </Panel>
    </div>
  );
}
