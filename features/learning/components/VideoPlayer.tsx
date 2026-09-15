'use client';

import { useRef } from 'react';
import type { SyntheticEvent } from 'react';

import type { EnrolledLesson } from '@/features/learning/server/data';
import { saveVideoProgress, setLessonProgress } from '@/features/learning/server/actions';

const SAVE_INTERVAL_SEC = 8;
const COMPLETE_THRESHOLD = 0.92;
const RESUME_MIN_SEC = 5;
const RESUME_MAX_FRACTION = 0.95;

/** Recorded-video lesson player: resumes from the last watched position and
 * auto-marks the lesson complete once playback crosses `COMPLETE_THRESHOLD`. */
export function VideoPlayer({
  lesson,
  completed,
  onCompleted,
}: {
  lesson: EnrolledLesson;
  completed: boolean;
  onCompleted: () => void;
}) {
  const lastSavedAtRef = useRef(0);
  const lastSavedPosRef = useRef(-1);
  const resumedRef = useRef(false);
  const autoCompletedRef = useRef(completed);

  function flushPosition(position: number) {
    const rounded = Math.round(position);
    if (rounded === lastSavedPosRef.current) return;
    lastSavedPosRef.current = rounded;
    lastSavedAtRef.current = Date.now();
    void saveVideoProgress(lesson.id, rounded);
  }

  function handleLoadedMetadata(e: SyntheticEvent<HTMLVideoElement>) {
    if (resumedRef.current) return;
    resumedRef.current = true;
    const video = e.currentTarget;
    const position = lesson.lastPositionSec ?? 0;
    const duration = video.duration || lesson.videoDurationSec || 0;
    if (position > RESUME_MIN_SEC && (duration === 0 || position / duration < RESUME_MAX_FRACTION)) {
      video.currentTime = position;
    }
  }

  function handleTimeUpdate(e: SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    const duration = video.duration || lesson.videoDurationSec || 0;

    if (!autoCompletedRef.current && duration > 0 && video.currentTime / duration >= COMPLETE_THRESHOLD) {
      autoCompletedRef.current = true;
      void setLessonProgress(lesson.id, true).then((res) => {
        if (res.ok) onCompleted();
      });
    }

    if (Date.now() - lastSavedAtRef.current >= SAVE_INTERVAL_SEC * 1000) {
      flushPosition(video.currentTime);
    }
  }

  function handlePauseOrEnded(e: SyntheticEvent<HTMLVideoElement>) {
    flushPosition(e.currentTarget.currentTime);
  }

  return (
    <video
      controls
      controlsList="nodownload"
      src={lesson.videoUrl ?? undefined}
      onLoadedMetadata={handleLoadedMetadata}
      onTimeUpdate={handleTimeUpdate}
      onPause={handlePauseOrEnded}
      onEnded={handlePauseOrEnded}
      className="aspect-video w-full rounded-2xl bg-black shadow-sm ring-1 ring-border/60"
    />
  );
}
