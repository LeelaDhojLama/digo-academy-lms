'use server';

import { revalidatePath } from 'next/cache';

import {
  createBatchSchema,
  createLearningPlanSchema,
  updateBatchSchema,
  updateLearningPlanSchema,
  type CreateBatchInput,
  type CreateLearningPlanInput,
  type UpdateBatchInput,
  type UpdateLearningPlanInput,
} from '@/features/cohorts/schemas';
import { recordAudit } from '@/lib/audit';
import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

async function assertCourse(courseId: string) {
  return db.course.findUnique({ where: { id: courseId }, select: { id: true } });
}

async function assertInstructor(instructorId: string) {
  return db.user.findFirst({
    where: { id: instructorId, role: ROLES.INSTRUCTOR },
    select: { id: true },
  });
}

export async function createBatch(input: CreateBatchInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { name, courseId, instructorId, startDate, endDate, capacity } = parsed.data;

  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };
  if (instructorId && !(await assertInstructor(instructorId))) {
    return { ok: false, error: 'Instructor not found.' };
  }

  const batch = await db.batch.create({
    data: { name, courseId, instructorId, startDate, endDate, capacity },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'batch.created',
    entityType: 'Batch',
    entityId: batch.id,
    metadata: { name, courseId },
  });

  revalidatePath('/admin/batches');
  return { ok: true };
}

export async function updateBatch(input: UpdateBatchInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = updateBatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { id, name, courseId, instructorId, startDate, endDate, capacity } = parsed.data;

  const existing = await db.batch.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'Batch not found.' };
  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };
  if (instructorId && !(await assertInstructor(instructorId))) {
    return { ok: false, error: 'Instructor not found.' };
  }

  await db.batch.update({
    where: { id },
    data: { name, courseId, instructorId, startDate, endDate, capacity },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'batch.updated',
    entityType: 'Batch',
    entityId: id,
  });

  revalidatePath('/admin/batches');
  return { ok: true };
}

export async function deleteBatch(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const batch = await db.batch.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!batch) return { ok: false, error: 'Batch not found.' };
  if (batch._count.enrollments > 0) {
    return {
      ok: false,
      error: `${batch._count.enrollments} enrollment(s) are in this batch — reassign them first.`,
    };
  }

  await db.batch.delete({ where: { id } });
  await recordAudit({
    actorId: session.user.id,
    action: 'batch.deleted',
    entityType: 'Batch',
    entityId: id,
    metadata: { name: batch.name },
  });

  revalidatePath('/admin/batches');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Learning plans
// ---------------------------------------------------------------------------

export async function createLearningPlan(input: CreateLearningPlanInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = createLearningPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { name, courseId, description } = parsed.data;
  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };

  const plan = await db.learningPlan.create({
    data: { name, courseId, description: description || null },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'learningPlan.created',
    entityType: 'LearningPlan',
    entityId: plan.id,
    metadata: { name, courseId },
  });

  revalidatePath('/admin/learning-plans');
  return { ok: true };
}

export async function updateLearningPlan(input: UpdateLearningPlanInput): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const parsed = updateLearningPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const { id, name, courseId, description } = parsed.data;

  const existing = await db.learningPlan.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: 'Learning plan not found.' };
  if (!(await assertCourse(courseId))) return { ok: false, error: 'Course not found.' };

  await db.learningPlan.update({
    where: { id },
    data: { name, courseId, description: description || null },
  });
  await recordAudit({
    actorId: session.user.id,
    action: 'learningPlan.updated',
    entityType: 'LearningPlan',
    entityId: id,
  });

  revalidatePath('/admin/learning-plans');
  return { ok: true };
}

export async function deleteLearningPlan(id: string): Promise<ActionResult> {
  const session = await authorize(ROLES.ADMIN);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const plan = await db.learningPlan.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!plan) return { ok: false, error: 'Learning plan not found.' };
  if (plan._count.enrollments > 0) {
    return {
      ok: false,
      error: `${plan._count.enrollments} enrollment(s) use this plan — reassign them first.`,
    };
  }

  await db.learningPlan.delete({ where: { id } });
  await recordAudit({
    actorId: session.user.id,
    action: 'learningPlan.deleted',
    entityType: 'LearningPlan',
    entityId: id,
    metadata: { name: plan.name },
  });

  revalidatePath('/admin/learning-plans');
  return { ok: true };
}
