import { CalendarClock, FileText, PlayCircle, Radio, Video } from 'lucide-react';
import Link from 'next/link';

import { CommunityChat } from '@/features/live/components/CommunityChat';
import { getStudentLive } from '@/features/live/server/data';
import { LiveCountdown } from '@/shared/components/dashboard/LiveCountdown';
import { CourseThumbnail } from '@/features/marketplace/components/CourseThumbnail';
import { requireRole } from '@/lib/auth/session';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function StudentLivePage() {
  const session = await requireRole(ROLES.STUDENT);
  const { featured, upcoming, recorded } = await getStudentLive(session.user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Main column */}
      <div className="space-y-8">
        {/* Hero */}
        {featured ? (
          <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-blue via-indigo-600 to-violet-600 p-6 text-white shadow-sm sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              {featured.nextOccurrence ? (
                <LiveCountdown target={featured.nextOccurrence} live={featured.isLive} />
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <Radio className="size-3.5" />
                  Weekly class
                </span>
              )}
              <h1 className="mt-4 max-w-xl font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {featured.name}
              </h1>
              <p className="mt-1.5 text-sm text-white/70">
                {featured.courseTitle} · {featured.instructorName}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {featured.meetLink ? (
                  <Button
                    className="rounded-full bg-white text-brand-blue hover:bg-white/90"
                    nativeButton={false}
                    render={
                      <a href={featured.meetLink} target="_blank" rel="noopener noreferrer">
                        <Video className="size-4" />
                        Join live (Google Meet)
                      </a>
                    }
                  />
                ) : (
                  <Button className="rounded-full bg-white/90 text-brand-blue" disabled>
                    <Video className="size-4" />
                    Link coming soon
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-full border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                  nativeButton={false}
                  render={<Link href={`/student/courses/${featured.courseId}`}>
                    <FileText className="size-4" />
                    Course materials
                  </Link>}
                />
              </div>
            </div>
          </section>
        ) : (
          <section className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Radio className="size-6" />
            </span>
            <h1 className="font-heading text-xl font-semibold">No live classes yet</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Once you&apos;re enrolled in a live batch, its weekly class link and recordings will
              appear here.
            </p>
            <Button
              className="mt-1 rounded-full"
              nativeButton={false}
              render={<Link href="/student/courses">Browse courses</Link>}
            />
          </section>
        )}

        {/* Other batches */}
        {upcoming.length > 0 ? (
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">Also enrolled</h2>
            <ul className="space-y-2">
              {upcoming.map((batch) => (
                <li
                  key={batch.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <CalendarClock className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{batch.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {batch.courseTitle}
                      {batch.nextOccurrence && ` · ${formatDate(batch.nextOccurrence)}`}
                    </p>
                  </div>
                  {batch.meetLink ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      nativeButton={false}
                      render={
                        <a href={batch.meetLink} target="_blank" rel="noopener noreferrer">
                          Join
                        </a>
                      }
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Class videos */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight">Class videos</h2>
          {recorded.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              Recordings from past classes will show up here once they&apos;re available.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recorded.map((video) => (
                <div
                  key={video.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-video bg-muted">
                    <CourseThumbnail title={video.courseTitle} url={video.thumbnailUrl} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-brand-blue">
                        <PlayCircle className="size-6" />
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {video.categoryName ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                          {video.categoryName}
                        </span>
                      ) : null}
                      <span className="ml-auto">{formatDate(video.createdAt)}</span>
                    </div>
                    <h3 className="line-clamp-2 font-medium leading-snug">{video.title}</h3>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="truncate text-xs text-muted-foreground">{video.batchName}</span>
                      {video.videoUrl ? (
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-brand-blue hover:underline"
                        >
                          Watch now
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Community chat */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <CommunityChat userName={session.user.name} />
      </aside>
    </div>
  );
}
