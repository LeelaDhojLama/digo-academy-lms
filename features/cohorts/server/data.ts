import 'server-only';

import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

/** All batches (cohorts) for the admin management list, newest first. */
export async function getBatches() {
  return db.batch.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { enrollments: true, liveClasses: true } },
    },
  });
}

export type AdminBatch = Awaited<ReturnType<typeof getBatches>>[number];

/** All learning plans for the admin management list, newest first. */
export async function getLearningPlans() {
  return db.learningPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

export type AdminLearningPlan = Awaited<ReturnType<typeof getLearningPlans>>[number];

/** Minimal course list for cohort assignment selects. */
export async function getCourseChoices() {
  return db.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } });
}

/** Instructors for the batch instructor select. */
export async function getInstructorChoices() {
  return db.user.findMany({
    where: { role: ROLES.INSTRUCTOR },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}
