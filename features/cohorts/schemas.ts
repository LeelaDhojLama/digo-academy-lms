import { z } from 'zod';

const optionalId = z
  .union([z.string(), z.literal('')])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const optionalDate = z
  .union([z.string(), z.literal('')])
  .optional()
  .transform((value) => (value && value.length > 0 ? new Date(value) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), 'Invalid date.');

const optionalCapacity = z
  .union([z.coerce.number().int().positive().max(100_000), z.literal('')])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value));

export const createBatchSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short.').max(80, 'Name is too long.'),
  courseId: z.string().min(1, 'Choose a course.'),
  instructorId: optionalId,
  startDate: optionalDate,
  endDate: optionalDate,
  capacity: optionalCapacity,
});
export type CreateBatchInput = z.input<typeof createBatchSchema>;

export const updateBatchSchema = createBatchSchema.extend({ id: z.string().min(1) });
export type UpdateBatchInput = z.input<typeof updateBatchSchema>;

export const createLearningPlanSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short.').max(80, 'Name is too long.'),
  courseId: z.string().min(1, 'Choose a course.'),
  description: z.string().trim().max(500).optional(),
});
export type CreateLearningPlanInput = z.input<typeof createLearningPlanSchema>;

export const updateLearningPlanSchema = createLearningPlanSchema.extend({ id: z.string().min(1) });
export type UpdateLearningPlanInput = z.input<typeof updateLearningPlanSchema>;
