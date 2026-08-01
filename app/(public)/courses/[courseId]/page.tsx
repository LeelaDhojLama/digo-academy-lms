import {
  Award,
  BookOpen,
  ChevronDown,
  ClipboardList,
  FileText,
  HelpCircle,
  Infinity as InfinityIcon,
  PlayCircle,
  Star,
  Users,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GuestInquiryForm } from '@/features/enrollment/components/GuestInquiryForm';
import { CourseThumbnail } from '@/features/marketplace/components/CourseThumbnail';
import { getMarketplaceCourse } from '@/features/marketplace/server/data';
import { DIFFICULTY_LABELS, type MarketplaceDifficulty } from '@/features/marketplace/schemas';
import { getSession } from '@/lib/auth/session';
import { Panel } from '@/shared/components/dashboard/Panel';
import { RichTextContent } from '@/shared/components/dashboard/RichTextContent';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';
import { cn } from '@/shared/utils/cn';
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
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('') || '?'
  );
}

export default async function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const [course, session] = await Promise.all([getMarketplaceCourse(courseId), getSession()]);
  if (!course) notFound();

  const isStudent = session?.user.role === ROLES.STUDENT;
  const lessonCount = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalDuration = course.sections.reduce(
    (sum, s) => sum + s.lessons.reduce((ls, l) => ls + (l.videoDurationSec ?? 0), 0),
    0
  );
  const videoLessons = course.sections.reduce(
    (sum, s) => sum + s.lessons.filter((l) => l.type === 'VIDEO').length,
    0
  );
  const resourceLessons = course.sections.reduce(
    (sum, s) => sum + s.lessons.filter((l) => l.type === 'NOTE' || l.type === 'ASSIGNMENT').length,
    0
  );
  const profile = course.instructor.instructorProfile;

  const includes = [
    totalDuration > 0
      ? { icon: Video, label: `${formatDuration(totalDuration)} of on-demand video` }
      : { icon: Video, label: `${videoLessons} video lessons` },
    { icon: FileText, label: `${resourceLessons} downloadable resources` },
    { icon: InfinityIcon, label: 'Full lifetime access' },
    { icon: Award, label: 'Certificate of completion' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/courses" className="transition-colors hover:text-foreground">
          Courses
        </Link>
        {course.category ? (
          <>
            <span>/</span>
            <Link
              href={`/courses?category=${course.category.id}`}
              className="transition-colors hover:text-foreground"
            >
              {course.category.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="truncate text-foreground">{course.title}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* -------------------------------------------------------------- */}
        {/* Main column                                                    */}
        {/* -------------------------------------------------------------- */}
        <div className="space-y-8">
          <div>
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {course.title}
            </h1>
            {course.subtitle ? (
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">{course.subtitle}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-brand-blue/10 text-[0.65rem] font-semibold text-brand-blue">
                  {initials(course.instructor.name)}
                </span>
                Created by{' '}
                <span className="font-medium text-foreground">{course.instructor.name}</span>
              </span>
              {course.ratingAvg > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">
                    {course.ratingAvg.toFixed(1)}
                  </span>
                  ({course._count.reviews})
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                {course._count.enrollments.toLocaleString()} enrolled
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                {DIFFICULTY_LABELS[course.difficulty as MarketplaceDifficulty]}
              </span>
              <span className="uppercase">{course.language}</span>
            </div>
          </div>

          {/* Video / preview */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-sm">
            <CourseThumbnail title={course.title} url={course.thumbnailUrl} />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-brand-blue shadow-lg">
                <PlayCircle className="size-8" />
              </span>
            </div>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              Preview this course
            </span>
          </div>

          {/* About */}
          {course.description?.trim() ? (
            <section>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                About this course
              </h2>
              <div className="mt-3">
                <RichTextContent html={course.description} />
              </div>
            </section>
          ) : null}

          {/* Syllabus */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-heading text-xl font-semibold tracking-tight">Course syllabus</h2>
              <p className="text-sm text-muted-foreground">
                {course.sections.length} sections · {lessonCount} lessons
                {totalDuration > 0 ? ` · ${formatDuration(totalDuration)}` : ''}
              </p>
            </div>
            {course.sections.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Curriculum coming soon.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {course.sections.map((section, index) => {
                  const sectionDuration = section.lessons.reduce(
                    (ls, l) => ls + (l.videoDurationSec ?? 0),
                    0
                  );
                  return (
                    <details
                      key={section.id}
                      open={index === 0}
                      className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                          <BookOpen className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            Module {index + 1}: {section.title}
                          </span>
                        </span>
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                          {section.lessons.length} lessons
                          {sectionDuration > 0 ? ` · ${formatDuration(sectionDuration)}` : ''}
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <ul className="divide-y divide-border/60 border-t border-border/60">
                        {section.lessons.map((lesson) => {
                          const Icon =
                            LESSON_ICONS[lesson.type as keyof typeof LESSON_ICONS] ?? BookOpen;
                          const duration = formatDuration(lesson.videoDurationSec ?? 0);
                          return (
                            <li
                              key={lesson.id}
                              className="flex items-center gap-3 px-5 py-3 text-sm"
                            >
                              <Icon className="size-4 shrink-0 text-brand-blue/70" />
                              <span className="flex-1 truncate">{lesson.title}</span>
                              {duration ? (
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {duration}
                                </span>
                              ) : null}
                            </li>
                          );
                        })}
                        {section.lessons.length === 0 ? (
                          <li className="px-5 py-3 text-sm text-muted-foreground">
                            No lessons yet.
                          </li>
                        ) : null}
                      </ul>
                    </details>
                  );
                })}
              </div>
            )}
          </section>

          {/* Instructor */}
          <section>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Your instructor</h2>
            <Panel className="mt-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-blue/10 text-xl font-semibold text-brand-blue">
                  {course.instructor.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar URL
                    <img
                      src={course.instructor.image}
                      alt={course.instructor.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials(course.instructor.name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-lg font-semibold">{course.instructor.name}</p>
                  {profile?.headline ? (
                    <p className="text-sm text-brand-blue">{profile.headline}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {profile && profile.ratingAvg > 0 ? (
                      <span className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {profile.ratingAvg.toFixed(1)} instructor rating
                      </span>
                    ) : null}
                    {profile && profile.totalStudents > 0 ? (
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {profile.totalStudents.toLocaleString()} students
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          {/* Student feedback */}
          {course.reviews.length > 0 ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Student feedback
                </h2>
                {course.ratingAvg > 0 ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-heading text-2xl font-semibold text-amber-500">
                      {course.ratingAvg.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < Math.round(course.ratingAvg)
                              ? 'size-4 fill-amber-400 text-amber-400'
                              : 'size-4 text-muted-foreground/40'
                          }
                        />
                      ))}
                    </span>
                    <span className="text-muted-foreground">({course._count.reviews})</span>
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {course.reviews.map((review) => (
                  <Panel key={review.id} className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-blue">
                        {initials(review.student.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{review.student.name}</p>
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={
                                i < review.rating
                                  ? 'size-3 fill-amber-400 text-amber-400'
                                  : 'size-3 text-muted-foreground/40'
                              }
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                    {review.text ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        “{review.text}”
                      </p>
                    ) : null}
                  </Panel>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Purchase sidebar                                               */}
        {/* -------------------------------------------------------------- */}
        <aside>
          <div className="lg:sticky lg:top-24">
            <Panel className="space-y-5">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-semibold">
                  {course.priceCents === 0
                    ? 'Free'
                    : formatMoney(course.priceCents, course.currency)}
                </span>
              </div>

              {isStudent ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You&apos;re signed in — continue to this course from your dashboard.
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    nativeButton={false}
                    render={<Link href={`/student/courses/${course.id}`}>Go to course</Link>}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Interested? Request enrollment and our team will reach out to help you get
                    started — no upfront payment.
                  </p>
                  <GuestInquiryForm courseId={course.id} />
                </div>
              )}

              <div className="border-t border-border/60 pt-4">
                <p className="text-sm font-medium">This course includes</p>
                <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                  {includes.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5">
                      <item.icon className="size-4 shrink-0 text-brand-blue" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
                Taught by{' '}
                <span className="font-medium text-foreground">{course.instructor.name}</span>
                {profile?.headline ? ` · ${profile.headline}` : ''}
              </p>
            </Panel>

            {/* Upsell band */}
            <div
              className={cn(
                'mt-4 overflow-hidden rounded-2xl bg-linear-to-br from-brand-blue to-indigo-700 p-5 text-white shadow-sm'
              )}
            >
              <p className="font-heading text-sm font-semibold">Digo for Business</p>
              <p className="mt-1 text-xs text-white/85">
                Upskill your whole team with cohort access and shared progress tracking.
              </p>
              <Link
                href="/register/instructor"
                className="mt-3 inline-block text-xs font-semibold underline underline-offset-4"
              >
                Learn more
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
