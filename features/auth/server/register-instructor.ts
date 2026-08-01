'use server';

import { APIError } from 'better-auth/api';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas';

export interface RegisterActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Register a new instructor. Runs entirely server-side because it elevates the
 * account's role — `role` is `input:false` in the Better Auth config, so it can
 * never be set from the client-facing sign-up. The account still goes through
 * normal email verification; admin approval of instructors lands in Phase 11.
 */
export async function registerInstructor(input: RegisterInput): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Please check the form and try again.' };
  }

  const { name, email, password } = parsed.data;

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    await db.user.update({
      where: { id: result.user.id },
      data: { role: ROLES.INSTRUCTOR },
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof APIError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}
