'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { FileUpload } from '@/features/courses/components/FileUpload';
import type { EditorLesson } from '@/features/courses/components/CurriculumEditor';
import { QuizEditor } from '@/features/courses/components/QuizEditor';
import { updateLessonContent } from '@/features/courses/server/actions';
import { RichTextEditor } from '@/shared/components/dashboard/RichTextEditor';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

/**
 * Per-lesson content editor. VIDEO lessons get a recorded-video upload plus an
 * auto-detected duration; NOTE lessons get rich-text notes and an optional PDF;
 * QUIZ lessons delegate to the dedicated QuizEditor. ASSIGNMENT is coming soon.
 */
export function LessonContentEditor({
  courseId,
  lesson,
  onSaved,
}: {
  courseId: string;
  lesson: EditorLesson;
  onSaved: () => void;
}) {
  const [videoKey, setVideoKey] = useState(lesson.videoKey ?? '');
  const [durationMin, setDurationMin] = useState(
    lesson.videoDurationSec ? (lesson.videoDurationSec / 60).toFixed(1) : ''
  );
  const [noteContent, setNoteContent] = useState(lesson.noteContent ?? '');
  const [notePdfKey, setNotePdfKey] = useState(lesson.notePdfKey ?? '');
  const [busy, setBusy] = useState(false);

  function probeDuration(file: File) {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDurationMin((video.duration / 60).toFixed(1));
      }
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.src = url;
  }

  async function save() {
    setBusy(true);
    const minutes = Number.parseFloat(durationMin);
    const videoDurationSec =
      Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : undefined;
    const result = await updateLessonContent(lesson.id, {
      videoKey,
      videoDurationSec,
      noteContent,
      notePdfKey,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not save content.');
      return;
    }
    toast.success('Lesson content saved.');
    onSaved();
  }

  const isVideo = lesson.type === 'VIDEO';
  const isNote = lesson.type === 'NOTE';
  const isAssignment = lesson.type === 'ASSIGNMENT';

  // Quizzes have their own richer authoring surface.
  if (lesson.type === 'QUIZ') {
    return <QuizEditor lesson={lesson} onSaved={onSaved} />;
  }

  return (
    <div className="mt-3 space-y-4 rounded-lg border bg-muted/20 p-4">
      {isVideo && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-sm font-medium">Recorded video</p>
            <FileUpload
              courseId={courseId}
              kind="video"
              accept="video/mp4,video/webm,video/quicktime"
              value={videoKey}
              onUploaded={setVideoKey}
              onFile={probeDuration}
            />
          </div>
          <div className="max-w-48">
            <label htmlFor={`dur-${lesson.id}`} className="mb-1.5 block text-sm font-medium">
              Duration (minutes)
            </label>
            <Input
              id={`dur-${lesson.id}`}
              type="number"
              min={0}
              step="0.1"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="e.g. 12"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-filled from the uploaded video; adjust if needed.
            </p>
          </div>
        </div>
      )}

      {isNote && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-sm font-medium">Notes</p>
            <RichTextEditor
              value={noteContent}
              onChange={setNoteContent}
              placeholder="Write lesson notes…"
              aria-label="Lesson notes"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Attach a PDF (optional)</p>
            <FileUpload
              courseId={courseId}
              kind="pdf"
              accept="application/pdf"
              value={notePdfKey}
              onUploaded={setNotePdfKey}
            />
          </div>
        </div>
      )}

      {isAssignment && (
        <p className="text-sm text-muted-foreground">
          Assignment content is set up in the assignments step (coming soon).
        </p>
      )}

      {!isAssignment && (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save content'}
          </Button>
        </div>
      )}
    </div>
  );
}
