'use client';

import {
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  FileText,
  HelpCircle,
  PlayCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { EnrolledCourse, EnrolledLesson } from '@/features/learning/server/data';
import { setLessonProgress } from '@/features/learning/server/actions';
import { RichTextContent } from '@/shared/components/dashboard/RichTextContent';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const LESSON_ICONS: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  NOTE: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return '';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function CoursePlayer({ data }: { data: EnrolledCourse }) {
  const lessons = useMemo(
    () => data.sections.flatMap((s) => s.lessons),
    [data.sections]
  );

  // Local completion state so the sidebar + progress update instantly on toggle.
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(lessons.filter((l) => l.completed).map((l) => l.id))
  );
  const [pending, setPending] = useState(false);

  const firstIncomplete = lessons.find((l) => !completedIds.has(l.id));
  const [activeId, setActiveId] = useState<string | null>(
    firstIncomplete?.id ?? lessons[0]?.id ?? null
  );

  const active = lessons.find((l) => l.id === activeId) ?? null;
  const total = lessons.length;
  const done = completedIds.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  async function toggleComplete(lesson: EnrolledLesson) {
    const next = !completedIds.has(lesson.id);
    // Optimistic update.
    setCompletedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(lesson.id);
      else copy.delete(lesson.id);
      return copy;
    });
    setPending(true);
    const result = await setLessonProgress(lesson.id, next);
    setPending(false);
    if (!result.ok) {
      // Revert on failure.
      setCompletedIds((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(lesson.id);
        else copy.add(lesson.id);
        return copy;
      });
      toast.error(result.error ?? 'Could not update progress.');
    }
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/60">
        <p className="font-medium">No lessons yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The instructor is still building this course. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
      {/* Curriculum sidebar */}
      <aside className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
          <div className="border-b p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Your progress</span>
              <span className="text-muted-foreground">
                {done}/{total}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-3">
            {data.sections.map((section, si) => (
              <div key={section.id} className="space-y-1">
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {si + 1}. {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.lessons.map((lesson) => {
                    const Icon = LESSON_ICONS[lesson.type] ?? BookOpen;
                    const isActive = lesson.id === activeId;
                    const isDone = completedIds.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setActiveId(lesson.id)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                          )}
                          <Icon className="size-4 shrink-0 text-primary/70" />
                          <span className="flex-1 truncate">{lesson.title}</span>
                          {lesson.videoDurationSec ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatDuration(lesson.videoDurationSec)}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Active lesson content */}
      <div className="min-w-0 space-y-4">
        {active && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {active.type.toLowerCase()}
                </p>
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {active.title}
                </h2>
              </div>
              <Button
                type="button"
                variant={completedIds.has(active.id) ? 'outline' : 'default'}
                onClick={() => toggleComplete(active)}
                disabled={pending}
              >
                <CheckCircle2 />
                {completedIds.has(active.id) ? 'Completed' : 'Mark complete'}
              </Button>
            </div>

            <LessonBody lesson={active} />
          </>
        )}
      </div>
    </div>
  );
}

function LessonBody({ lesson }: { lesson: EnrolledLesson }) {
  if (lesson.type === 'VIDEO') {
    if (!lesson.videoUrl) {
      return (
        <Placeholder icon={PlayCircle} text="The recorded video isn’t available yet." />
      );
    }
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- user-uploaded lesson videos have no caption track yet
      <video
        controls
        controlsList="nodownload"
        src={lesson.videoUrl}
        className="aspect-video w-full rounded-2xl bg-black shadow-sm ring-1 ring-border/60"
      />
    );
  }

  if (lesson.type === 'NOTE') {
    const hasNotes = Boolean(lesson.noteContent?.trim());
    return (
      <div className="space-y-4">
        {hasNotes ? (
          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
            <RichTextContent html={lesson.noteContent ?? ''} />
          </div>
        ) : null}
        {lesson.notePdfUrl ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Attached PDF</p>
              <a
                href={lesson.notePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open in new tab
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <iframe
              title={`${lesson.title} — PDF`}
              src={lesson.notePdfUrl}
              className="h-[70vh] w-full rounded-2xl border bg-muted"
            />
          </div>
        ) : null}
        {!hasNotes && !lesson.notePdfUrl ? (
          <Placeholder icon={FileText} text="No notes have been added yet." />
        ) : null}
      </div>
    );
  }

  if (lesson.type === 'QUIZ') {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
        <div className="flex items-center gap-2 text-primary">
          <HelpCircle className="size-5" />
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {lesson.quiz?.title ?? lesson.title}
          </h3>
        </div>
        {lesson.quiz?.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{lesson.quiz.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 font-medium">
            {lesson.quiz?.questionCount ?? 0} questions
          </span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium">
            Pass mark {lesson.quiz?.passingScore ?? 0}%
          </span>
        </div>
        <Button className="mt-5" disabled>
          Start quiz (coming soon)
        </Button>
      </div>
    );
  }

  return <Placeholder icon={ClipboardList} text="Assignment submissions are coming soon." />;
}

function Placeholder({ icon: Icon, text }: { icon: typeof PlayCircle; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-12 text-center shadow-sm ring-1 ring-border/60">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground [&_svg]:size-6">
        <Icon />
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
