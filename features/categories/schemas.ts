import { z } from 'zod';

export const categoryNameSchema = z
  .string()
  .trim()
  .min(2, 'Name is too short')
  .max(60, 'Name is too long');

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  /** Empty / omitted = a top-level category. Otherwise the parent's id. */
  parentId: z.union([z.string(), z.literal('')]).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const renameCategorySchema = z.object({ name: categoryNameSchema });
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;
