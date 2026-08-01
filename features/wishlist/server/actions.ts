'use server';

import { revalidatePath } from 'next/cache';

import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface WishlistResult {
  ok: boolean;
  wishlisted?: boolean;
  error?: string;
}

/**
 * Add or remove a course from the current student's wishlist. Idempotent per state
 * and safe against direct POST — re-checks the student role independently.
 */
export async function toggleWishlist(courseId: string): Promise<WishlistResult> {
  const session = await authorize(ROLES.STUDENT);
  if (!session) return { ok: false, error: 'Not authorized.' };

  if (!courseId) return { ok: false, error: 'Missing course.' };

  const studentId = session.user.id;
  const existing = await db.wishlistItem.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath('/student/wishlist');
    return { ok: true, wishlisted: false };
  }

  const course = await db.course.findFirst({
    where: { id: courseId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!course) return { ok: false, error: 'Course is not available.' };

  await db.wishlistItem.create({ data: { studentId, courseId } });
  revalidatePath('/student/wishlist');
  return { ok: true, wishlisted: true };
}
