'use server';

import { revalidatePath } from 'next/cache';

import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Mark a lesson complete/incomplete for the signed-in student. Independently
 * re-checks that the caller is a student enrolled in the lesson's course
 * (reachable via direct POST).
 */
export async function setLessonProgress(
  lessonId: string,
  completed: boolean
): Promise<ActionResult> {
  const session = await authorize(ROLES.STUDENT);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, section: { select: { courseId: true } } },
  });
  if (!lesson) return { ok: false, error: 'Lesson not found.' };

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: session.user.id, courseId: lesson.section.courseId },
    },
    select: { id: true },
  });
  if (!enrollment) return { ok: false, error: 'You are not enrolled in this course.' };

  await db.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    create: {
      enrollmentId: enrollment.id,
      lessonId,
      studentId: session.user.id,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: { completed, completedAt: completed ? new Date() : null },
  });

  revalidatePath(`/student/courses/${lesson.section.courseId}/learn`);
  return { ok: true };
}
