import { CalendarClock, FileText, PlayCircle, Radio, Video } from 'lucide-react';
import Link from 'next/link';

import { CommunityChat } from '@/features/live/components/CommunityChat';
import { LiveCountdown } from '@/features/live/components/LiveCountdown';
import { getStudentLive } from '@/features/live/server/data';
import { CourseThumbnail } from '@/features/marketplace/components/CourseThumbnail';
import { requireRole } from '@/lib/auth/session';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

function formatClock(sec: number | null): string {
  if (!sec || sec <= 0) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
              <LiveCountdown target={featured.scheduledAt} live={featured.status === 'LIVE'} />
              <h1 className="mt-4 max-w-xl font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {featured.title}
              </h1>
              <p className="mt-1.5 text-sm text-white/70">
                {featured.courseTitle} · {featured.instructorName}
              </p>
              {featured.description ? (
                <p className="mt-3 max-w-lg text-sm text-white/85">{featured.description}</p>
              ) : null}
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
            <h1 className="font-heading text-xl font-semibold">No upcoming live sessions</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              Scheduled classes for the courses you&apos;re enrolled in will appear here. Explore the
              catalog to join a live cohort.
            </p>
            <Button
              className="mt-1 rounded-full"
              nativeButton={false}
              render={<Link href="/student/courses">Browse courses</Link>}
            />
          </section>
        )}

        {/* Upcoming strip */}
        {upcoming.length > 0 ? (
          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">Also scheduled</h2>
            <ul className="space-y-2">
              {upcoming.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <CalendarClock className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.courseTitle} · {formatDate(item.scheduledAt)}
                    </p>
                  </div>
                  {item.meetLink ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      nativeButton={false}
                      render={
                        <a href={item.meetLink} target="_blank" rel="noopener noreferrer">
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

        {/* Recorded sessions */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight">
            Recorded live sessions
          </h2>
          {recorded.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
              Recordings from past sessions will show up here once they&apos;re available.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recorded.map((rec) => {
                const clock = formatClock(rec.durationSec);
                return (
                  <div
                    key={rec.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-video bg-muted">
                      <CourseThumbnail title={rec.courseTitle} url={rec.thumbnailUrl} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-brand-blue">
                          <PlayCircle className="size-6" />
                        </span>
                      </div>
                      {clock ? (
                        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                          {clock}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {rec.categoryName ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                            {rec.categoryName}
                          </span>
                        ) : null}
                        <span className="ml-auto">{formatDate(rec.scheduledAt)}</span>
                      </div>
                      <h3 className="line-clamp-2 font-medium leading-snug">{rec.title}</h3>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {rec.instructorName}
                        </span>
                        {rec.recordingUrl ? (
                          <a
                            href={rec.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-brand-blue hover:underline"
                          >
                            Watch now
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Processing…</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
