'use server';

import { revalidatePath } from 'next/cache';

import {
  createLiveClassSchema,
  updateLiveClassSchema,
  type CreateLiveClassInput,
  type UpdateLiveClassInput,
} from '@/features/live-classes/schemas';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { createMeetEvent, deleteMeetEvent, isMeetConfigured, updateMeetEvent } from '@/lib/meet';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function assertBatchBelongsToCourse(batchId: string, courseId: string): Promise<boolean> {
  const batch = await db.batch.findUnique({ where: { id: batchId }, select: { courseId: true } });
  return batch?.courseId === courseId;
}

/**
 * Schedules a live class: creates a Meet-enabled Calendar event first (so the
 * LMS record is never written without a real, working meeting link), then
 * persists it. Admin-only — batches/live classes are admin-managed per the
 * project's admin-superuser rule.
 */
export async function createLiveClass(input: CreateLiveClassInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (!isMeetConfigured) return { ok: false, error: 'Connect Google Calendar in Settings first.' };

  const parsed = createLiveClassSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { title, description, courseId, batchId, instructorId, scheduledAt, durationMin } = parsed.data;

  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return { ok: false, error: 'Course not found.' };
  const instructor = await db.user.findFirst({
    where: { id: instructorId, role: ROLES.INSTRUCTOR },
    select: { id: true },
  });
  if (!instructor) return { ok: false, error: 'Instructor not found.' };
  if (batchId && !(await assertBatchBelongsToCourse(batchId, courseId))) {
    return { ok: false, error: 'That batch does not belong to the selected course.' };
  }

  let meet;
  try {
    meet = await createMeetEvent({ title, description, startTime: scheduledAt, durationMin });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not create the Google Calendar event.',
    };
  }

  const liveClass = await db.liveClass.create({
    data: {
      title,
      description,
      courseId,
      batchId,
      instructorId,
      scheduledAt,
      durationMin,
      meetLink: meet.meetLink,
      googleEventId: meet.googleEventId,
    },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'liveClass.created',
    entityType: 'LiveClass',
    entityId: liveClass.id,
    metadata: { title, courseId, scheduledAt: scheduledAt.toISOString() },
  });

  revalidatePath('/admin/live-classes');
  revalidatePath('/student/live');
  return { ok: true };
}

export async function updateLiveClass(input: UpdateLiveClassInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = updateLiveClassSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { id, title, description, courseId, batchId, instructorId, scheduledAt, durationMin } = parsed.data;

  const existing = await db.liveClass.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Live class not found.' };
  if (existing.status === 'CANCELLED') return { ok: false, error: 'This class was cancelled.' };

  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return { ok: false, error: 'Course not found.' };
  const instructor = await db.user.findFirst({
    where: { id: instructorId, role: ROLES.INSTRUCTOR },
    select: { id: true },
  });
  if (!instructor) return { ok: false, error: 'Instructor not found.' };
  if (batchId && !(await assertBatchBelongsToCourse(batchId, courseId))) {
    return { ok: false, error: 'That batch does not belong to the selected course.' };
  }

  if (existing.googleEventId) {
    try {
      await updateMeetEvent(existing.googleEventId, { title, description, startTime: scheduledAt, durationMin });
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Could not update the Google Calendar event.',
      };
    }
  }

  await db.liveClass.update({
    where: { id },
    data: { title, description, courseId, batchId, instructorId, scheduledAt, durationMin },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'liveClass.updated',
    entityType: 'LiveClass',
    entityId: id,
  });

  revalidatePath('/admin/live-classes');
  revalidatePath('/student/live');
  return { ok: true };
}

/** Cancels a live class. The Calendar event is best-effort deleted — a stale
 * calendar entry never blocks cancelling the LMS-side record. */
export async function cancelLiveClass(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const existing = await db.liveClass.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: 'Live class not found.' };
  if (existing.status === 'CANCELLED') return { ok: true };

  if (existing.googleEventId) {
    try {
      await deleteMeetEvent(existing.googleEventId);
    } catch (error) {
      console.error('liveClass.cancel: calendar delete failed', error);
    }
  }

  await db.liveClass.update({ where: { id }, data: { status: 'CANCELLED' } });
  await recordAudit({
    actorId: session.user.id,
    action: 'liveClass.cancelled',
    entityType: 'LiveClass',
    entityId: id,
    metadata: { title: existing.title },
  });

  revalidatePath('/admin/live-classes');
  revalidatePath('/student/live');
  return { ok: true };
}
