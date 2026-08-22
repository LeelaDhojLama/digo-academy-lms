import { FileUp } from 'lucide-react';

import { CourseImporter } from '@/features/course-import/components/CourseImporter';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function ImportCoursePage() {
  await requireRole(ROLES.ADMIN);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<FileUp />}
        title="Import course from document"
        description="Turn a structured Word .docx into a draft course — modules become sections, with notes and a quiz per module. Review and publish it afterwards like any course."
      />
      <CourseImporter />
    </div>
  );
}
