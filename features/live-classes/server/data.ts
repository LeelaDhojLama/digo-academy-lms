import 'server-only';

import { db } from '@/lib/db';

/** All live classes for the admin management list, soonest first. */
export async function getLiveClasses() {
  return db.liveClass.findMany({
    orderBy: { scheduledAt: 'desc' },
    include: {
      course: { select: { id: true, title: true } },
      batch: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true } },
    },
  });
}

export type AdminLiveClass = Awaited<ReturnType<typeof getLiveClasses>>[number];

/** Minimal batch list for the live-class batch select, filterable by course client-side. */
export async function getBatchChoices() {
  return db.batch.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, courseId: true },
  });
}
