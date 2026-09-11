import { Settings } from 'lucide-react';

import { SettingsForm } from '@/features/settings/components/SettingsForm';
import { getSettings } from '@/features/settings/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminSettingsPage() {
  await requireRole(ROLES.ADMIN);
  const values = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Settings />}
        title="Platform settings"
        description="Global configuration. Changes take effect immediately and are audited."
      />
      <SettingsForm values={values} />
    </div>
  );
}
