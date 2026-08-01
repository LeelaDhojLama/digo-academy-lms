import 'server-only';

import { db } from '@/lib/db';
import { isS3Configured, presignDownload } from '@/lib/storage';

async function resolveThumbnail(key: string | null): Promise<string | null> {
  if (!key || !isS3Configured) return null;
  try {
    return await presignDownload(key);
  } catch {
    return null;
  }
}

/** The student's saved courses, newest first, with published courses only surfaced. */
export async function getWishlist(studentId: string) {
  const items = await db.wishlistItem.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      course: {
        include: {
          category: { select: { id: true, name: true } },
          instructor: { select: { id: true, name: true } },
          _count: { select: { sections: true, enrollments: true, reviews: true } },
        },
      },
    },
  });

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      course: { ...item.course, thumbnailUrl: await resolveThumbnail(item.course.thumbnailKey) },
    }))
  );
}

/** Set of course ids the student has wishlisted — for toggling buttons in lists. */
export async function getWishlistedCourseIds(studentId: string): Promise<Set<string>> {
  const rows = await db.wishlistItem.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  return new Set(rows.map((r) => r.courseId));
}

export async function isWishlisted(studentId: string, courseId: string): Promise<boolean> {
  const item = await db.wishlistItem.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  return item !== null;
}

export async function getWishlistCount(studentId: string): Promise<number> {
  return db.wishlistItem.count({ where: { studentId } });
}
