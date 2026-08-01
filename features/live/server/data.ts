import 'server-only';

import { db } from '@/lib/db';
import { isS3Configured, presignDownload } from '@/lib/storage';

async function sign(key: string | null): Promise<string | null> {
  if (!key || !isS3Configured) return null;
  try {
    return await presignDownload(key);
  } catch {
    return null;
  }
}

/** A live/scheduled session surfaced in the hero + "upcoming" strip. */
export interface UpcomingLiveClass {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMin: number;
  status: string;
  meetLink: string | null;
  courseId: string;
  courseTitle: string;
  instructorName: string;
}

/** A past session with a recording, shown in the archive grid. */
export interface RecordedSession {
  id: string;
  title: string;
  courseTitle: string;
  categoryName: string | null;
  instructorName: string;
  scheduledAt: string;
  durationSec: number | null;
  thumbnailUrl: string | null;
  recordingUrl: string | null;
}

/**
 * Live-class portal data for a student: sessions for courses they're enrolled in.
 * `featured` is the next upcoming (or currently live) session; `recorded` lists
 * past sessions that have a recording.
 */
export async function getStudentLive(studentId: string): Promise<{
  featured: UpcomingLiveClass | null;
  upcoming: UpcomingLiveClass[];
  recorded: RecordedSession[];
}> {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  if (courseIds.length === 0) return { featured: null, upcoming: [], recorded: [] };

  // Include sessions that started up to 2h ago so a currently-live class still shows.
  const liveWindowStart = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [upcomingRows, recordedRows] = await Promise.all([
    db.liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: { in: ['SCHEDULED', 'LIVE'] },
        scheduledAt: { gte: liveWindowStart },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      include: {
        course: { select: { title: true } },
        instructor: { select: { name: true } },
      },
    }),
    db.liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'ENDED',
        recordings: { some: {} },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 6,
      include: {
        course: { select: { title: true, thumbnailKey: true, category: { select: { name: true } } } },
        instructor: { select: { name: true } },
        recordings: { orderBy: { createdAt: 'asc' }, take: 1 },
      },
    }),
  ]);

  const upcoming: UpcomingLiveClass[] = upcomingRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMin: row.durationMin,
    status: row.status,
    meetLink: row.meetLink,
    courseId: row.courseId,
    courseTitle: row.course.title,
    instructorName: row.instructor.name,
  }));

  const recorded: RecordedSession[] = await Promise.all(
    recordedRows.map(async (row) => {
      const recording = row.recordings[0];
      return {
        id: row.id,
        title: row.title,
        courseTitle: row.course.title,
        categoryName: row.course.category?.name ?? null,
        instructorName: row.instructor.name,
        scheduledAt: row.scheduledAt.toISOString(),
        durationSec: recording?.durationSec ?? null,
        thumbnailUrl: await sign(row.course.thumbnailKey),
        recordingUrl: recording ? await sign(recording.s3Key) : null,
      };
    })
  );

  return { featured: upcoming[0] ?? null, upcoming: upcoming.slice(1), recorded };
}
