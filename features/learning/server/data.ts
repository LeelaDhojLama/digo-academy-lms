import 'server-only';

import { db } from '@/lib/db';
import { isS3Configured, presignDownload } from '@/lib/storage';

/** Sign an S3 key for playback/download, or null when unavailable. */
async function sign(key: string | null): Promise<string | null> {
  if (!key || !isS3Configured) return null;
  try {
    return await presignDownload(key);
  } catch {
    return null;
  }
}

/**
 * Full course content for an enrolled student's course player. Returns null when
 * the student is not enrolled (the caller redirects). Video/PDF keys are resolved
 * to short-lived signed URLs; quizzes expose only overview info (no answers).
 */
export async function getEnrolledCourse(courseId: string, studentId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  if (!enrollment) return null;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true } },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { quiz: { include: { _count: { select: { questions: true } } } } },
          },
        },
      },
    },
  });
  if (!course) return null;

  const progressRows = await db.lessonProgress.findMany({
    where: { enrollmentId: enrollment.id, completed: true },
    select: { lessonId: true },
  });
  const completedSet = new Set(progressRows.map((p) => p.lessonId));

  const sections = await Promise.all(
    course.sections.map(async (section) => ({
      id: section.id,
      title: section.title,
      lessons: await Promise.all(
        section.lessons.map(async (lesson) => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type as string,
          videoUrl: lesson.type === 'VIDEO' ? await sign(lesson.videoKey) : null,
          videoDurationSec: lesson.videoDurationSec,
          noteContent: lesson.type === 'NOTE' ? lesson.noteContent : null,
          notePdfUrl: lesson.type === 'NOTE' ? await sign(lesson.notePdfKey) : null,
          quiz: lesson.quiz
            ? {
                title: lesson.quiz.title,
                description: lesson.quiz.description,
                passingScore: lesson.quiz.passingScore,
                questionCount: lesson.quiz._count.questions,
              }
            : null,
          completed: completedSet.has(lesson.id),
        }))
      ),
    }))
  );

  const total = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const completed = sections.reduce(
    (sum, s) => sum + s.lessons.filter((l) => l.completed).length,
    0
  );

  return {
    enrollmentId: enrollment.id,
    course: { id: course.id, title: course.title, instructorName: course.instructor.name },
    sections,
    progress: { completed, total },
  };
}

export type EnrolledCourse = NonNullable<Awaited<ReturnType<typeof getEnrolledCourse>>>;
export type EnrolledSection = EnrolledCourse['sections'][number];
export type EnrolledLesson = EnrolledSection['lessons'][number];
