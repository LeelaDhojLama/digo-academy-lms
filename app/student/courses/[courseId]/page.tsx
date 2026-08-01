import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  HelpCircle,
  PlayCircle,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { InquiryForm } from '@/features/enrollment/components/InquiryForm';
import { getStudentCourseBooking } from '@/features/enrollment/server/data';
import { CourseThumbnail } from '@/features/marketplace/components/CourseThumbnail';
import { getMarketplaceCourse } from '@/features/marketplace/server/data';
import { DIFFICULTY_LABELS, type MarketplaceDifficulty } from '@/features/marketplace/schemas';
import { WishlistButton } from '@/features/wishlist/components/WishlistButton';
import { isWishlisted } from '@/features/wishlist/server/data';
import { requireRole } from '@/lib/auth/session';
import { Panel } from '@/shared/components/dashboard/Panel';
import { RichTextContent } from '@/shared/components/dashboard/RichTextContent';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';
import { formatMoney } from '@/shared/utils/money';

const LESSON_ICONS = {
  VIDEO: PlayCircle,
  NOTE: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
} as const;

function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return '';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await requireRole(ROLES.STUDENT);

  const course = await getMarketplaceCourse(courseId);
  if (!course) notFound();

  const [wishlisted, booking] = await Promise.all([
    isWishlisted(session.user.id, courseId),
    getStudentCourseBooking(session.user.id, courseId),
  ]);

  const lessonCount = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (sum, s) => sum + s.lessons.reduce((ls, l) => ls + (l.videoDurationSec ?? 0), 0),
    0
  );

  return (
    <div className="space-y-6">
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to catalog
      </Link>

      {/* Course hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/60">
        <div className="h-40 w-full sm:h-48 lg:h-56">
          <CourseThumbnail title={course.title} url={course.thumbnailUrl} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-white/90">
            {course.category ? <span>{course.category.name}</span> : null}
            <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
              {DIFFICULTY_LABELS[course.difficulty as MarketplaceDifficulty]}
            </span>
            <span className="uppercase">{course.language}</span>
            {course.ratingAvg > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {course.ratingAvg.toFixed(1)} ({course._count.reviews})
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {course._count.enrollments} enrolled
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {course.title}
          </h1>
          {course.subtitle ? (
            <p className="mt-1 max-w-2xl text-sm text-white/85">{course.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {course.description?.trim() ? (
            <Panel>
              <h2 className="mb-3 font-heading text-lg font-semibold">About this course</h2>
              <RichTextContent html={course.description} />
            </Panel>
          ) : null}

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Curriculum</h2>
              <p className="text-sm text-muted-foreground">
                {course.sections.length} sections · {lessonCount} lessons
                {totalDuration > 0 ? ` · ${formatDuration(totalDuration)}` : ''}
              </p>
            </div>
            {course.sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">Curriculum coming soon.</p>
            ) : (
              <div className="space-y-4">
                {course.sections.map((section) => (
                  <div key={section.id}>
                    <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
                    <ul className="space-y-1.5">
                      {section.lessons.map((lesson) => {
                        const Icon = LESSON_ICONS[lesson.type as keyof typeof LESSON_ICONS] ?? BookOpen;
                        const duration = formatDuration(lesson.videoDurationSec ?? 0);
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-2.5 text-sm text-muted-foreground"
                          >
                            <Icon className="size-4 shrink-0 text-primary/70" />
                            <span className="flex-1 text-foreground">{lesson.title}</span>
                            {duration ? <span className="text-xs">{duration}</span> : null}
                          </li>
                        );
                      })}
                      {section.lessons.length === 0 ? (
                        <li className="text-sm text-muted-foreground">No lessons yet.</li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {course.reviews.length > 0 ? (
            <Panel>
              <h2 className="mb-4 font-heading text-lg font-semibold">Student reviews</h2>
              <ul className="space-y-4">
                {course.reviews.map((review) => (
                  <li key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{review.student.name}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < review.rating
                                ? 'size-3.5 fill-amber-400 text-amber-400'
                                : 'size-3.5 text-muted-foreground/40'
                            }
                          />
                        ))}
                      </span>
                    </div>
                    {review.text ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">{review.text}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Panel className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-3xl font-semibold">
                  {course.priceCents === 0 ? 'Free' : formatMoney(course.priceCents, course.currency)}
                </span>
                <WishlistButton courseId={course.id} initialWishlisted={wishlisted} variant="icon" />
              </div>

              {booking.enrolled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4 shrink-0" />
                    You&apos;re enrolled in this course.
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href={`/student/courses/${course.id}/learn`}>Go to course</Link>}
                  />
                </div>
              ) : booking.openInquiry ? (
                <div className="space-y-2 rounded-xl bg-muted p-3 text-sm">
                  <p className="font-medium">Inquiry submitted</p>
                  <p className="text-muted-foreground">
                    Our team is reviewing your request. Track its status on your{' '}
                    <Link href="/student/inquiries" className="text-primary underline underline-offset-2">
                      inquiries
                    </Link>{' '}
                    page.
                  </p>
                </div>
              ) : (
                <InquiryForm courseId={course.id} />
              )}

              <p className="text-xs text-muted-foreground">
                Taught by <span className="font-medium text-foreground">{course.instructor.name}</span>
                {course.instructor.instructorProfile?.headline
                  ? ` · ${course.instructor.instructorProfile.headline}`
                  : ''}
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
