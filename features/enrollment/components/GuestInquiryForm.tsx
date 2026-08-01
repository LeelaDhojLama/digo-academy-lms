'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  ENROLLMENT_MODES,
  ENROLLMENT_MODE_LABELS,
  createGuestInquirySchema,
  type CreateGuestInquiryInput,
} from '@/features/enrollment/schemas';
import { createGuestInquiry } from '@/features/enrollment/server/actions';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

const MODE_HINTS: Record<(typeof ENROLLMENT_MODES)[number], string> = {
  GROUP_LIVE: 'Scheduled live sessions with an instructor and a cohort.',
  SELF_PACED: 'Recorded lessons and materials you work through anytime.',
};

/**
 * Public (guest) booking form. Captures contact details and submits an inquiry
 * without requiring an account — the admin creates the student account on
 * enrollment. Shows a confirmation state on success.
 */
export function GuestInquiryForm({ courseId }: { courseId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGuestInquiryInput>({
    resolver: zodResolver(createGuestInquirySchema),
    defaultValues: { courseId, mode: 'GROUP_LIVE', name: '', email: '', phone: '', message: '' },
  });

  async function onSubmit(values: CreateGuestInquiryInput) {
    const result = await createGuestInquiry(values);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not submit your inquiry.');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Request received!</p>
          <p className="mt-0.5">
            Thanks for your interest — our team will reach out by email shortly to help you enroll.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register('courseId')} />

      <Field>
        <FieldLabel>How would you like to learn?</FieldLabel>
        <Controller
          control={control}
          name="mode"
          render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              {ENROLLMENT_MODES.map((mode) => {
                const selected = field.value === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => field.onChange(mode)}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-input hover:bg-muted/50'
                    )}
                  >
                    <span className="block text-sm font-medium">
                      {ENROLLMENT_MODE_LABELS[mode]}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {MODE_HINTS[mode]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <FieldError errors={[errors.mode]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="name">Full name</FieldLabel>
        <Input id="name" autoComplete="name" {...register('name')} />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
        <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
        <FieldError errors={[errors.phone]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="message">Message (optional)</FieldLabel>
        <Textarea
          id="message"
          rows={3}
          placeholder="Questions about schedule, prerequisites, pricing…"
          {...register('message')}
        />
        <FieldError errors={[errors.message]} />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Request enrollment'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No payment now — we&apos;ll contact you to complete enrollment.
      </p>
    </form>
  );
}
