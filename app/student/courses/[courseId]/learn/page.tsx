import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { CoursePlayer } from '@/features/learning/components/CoursePlayer';
import { getEnrolledCourse } from '@/features/learning/server/data';
import { requireRole } from '@/lib/auth/session';
import { ROLES } from '@/shared/constants/roles';

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await requireRole(ROLES.STUDENT);

  const data = await getEnrolledCourse(courseId, session.user.id);
  // Not enrolled (or course gone) → send back to the course detail page.
  if (!data) redirect(`/student/courses/${courseId}`);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to course
        </Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{data.course.title}</h1>
        <p className="text-sm text-muted-foreground">
          Taught by {data.course.instructorName}
        </p>
      </div>

      <CoursePlayer data={data} />
    </div>
  );
}
