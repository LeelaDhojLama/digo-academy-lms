import { Radio } from 'lucide-react';

import { getCourseChoices, getInstructorChoices } from '@/features/cohorts/server/data';
import { LiveClassManager, type LiveClassRow } from '@/features/live-classes/components/LiveClassManager';
import { getBatchChoices, getLiveClasses } from '@/features/live-classes/server/data';
import { requireRole } from '@/lib/auth/session';
import { getMeetConnection } from '@/lib/meet';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminLiveClassesPage() {
  await requireRole(ROLES.ADMIN);
  const [liveClasses, courses, instructors, batches, connection] = await Promise.all([
    getLiveClasses(),
    getCourseChoices(),
    getInstructorChoices(),
    getBatchChoices(),
    getMeetConnection(),
  ]);

  const rows: LiveClassRow[] = liveClasses.map((lc) => ({
    id: lc.id,
    title: lc.title,
    description: lc.description,
    courseId: lc.courseId,
    courseTitle: lc.course.title,
    batchId: lc.batchId,
    batchName: lc.batch?.name ?? null,
    instructorId: lc.instructorId,
    instructorName: lc.instructor.name,
    scheduledAt: lc.scheduledAt.toISOString(),
    durationMin: lc.durationMin,
    status: lc.status,
    meetLink: lc.meetLink,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<Radio />}
        title="Live classes"
        description="Schedule Google Meet sessions for a course or a specific batch."
      />
      {!connection && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Connect Google Calendar in{' '}
          <a href="/admin/settings" className="underline underline-offset-2">
            Settings
          </a>{' '}
          before scheduling a class.
        </p>
      )}
      <LiveClassManager
        liveClasses={rows}
        courses={courses.map((c) => ({ id: c.id, name: c.title }))}
        instructors={instructors}
        batches={batches}
      />
    </div>
  );
}
