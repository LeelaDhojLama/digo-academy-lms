import { z } from 'zod';

const optionalId = z
  .union([z.string(), z.literal('')])
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const scheduledAt = z
  .string()
  .min(1, 'Choose a date & time.')
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), 'Invalid date/time.')
  .refine((value) => value.getTime() > Date.now() - 5 * 60_000, 'Pick a time in the future.');

const durationMin = z.coerce.number().int().min(10, 'At least 10 minutes.').max(480, 'At most 8 hours.');

const title = z
  .string()
  .trim()
  .min(1, 'Title is required.')
  .min(2, 'Title must be at least 2 characters.')
  .max(120, 'Title is too long.');

export const createLiveClassSchema = z.object({
  title,
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  courseId: z.string().min(1, 'Choose a course.'),
  batchId: optionalId,
  instructorId: z.string().min(1, 'Choose an instructor.'),
  scheduledAt,
  durationMin,
});
export type CreateLiveClassInput = z.input<typeof createLiveClassSchema>;

export const updateLiveClassSchema = createLiveClassSchema.extend({ id: z.string().min(1) });
export type UpdateLiveClassInput = z.input<typeof updateLiveClassSchema>;
