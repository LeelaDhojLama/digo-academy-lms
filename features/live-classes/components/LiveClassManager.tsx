'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { cancelLiveClass, createLiveClass, updateLiveClass } from '@/features/live-classes/server/actions';
import { createLiveClassSchema } from '@/features/live-classes/schemas';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useConfirm } from '@/shared/hooks/use-confirm';
import { cn } from '@/shared/utils/cn';
import { firstFieldErrors } from '@/shared/utils/zod-errors';

export interface LiveClassRow {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  courseTitle: string;
  batchId: string | null;
  batchName: string | null;
  instructorId: string;
  instructorName: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  meetLink: string | null;
}

interface Choice {
  id: string;
  name: string;
}

interface BatchChoice extends Choice {
  courseId: string;
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20';

interface FormValues {
  title: string;
  description: string;
  courseId: string;
  batchId: string;
  instructorId: string;
  scheduledAt: string;
  durationMin: string;
}

const emptyForm: FormValues = {
  title: '',
  description: '',
  courseId: '',
  batchId: '',
  instructorId: '',
  scheduledAt: '',
  durationMin: '60',
};

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSchedule(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function LiveClassForm({
  courses,
  instructors,
  batches,
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
  errors = {},
}: {
  courses: Choice[];
  instructors: Choice[];
  batches: BatchChoice[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  pending: boolean;
  errors?: Partial<Record<keyof FormValues, string>>;
}) {
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  const batchesForCourse = useMemo(
    () => batches.filter((b) => b.courseId === values.courseId),
    [batches, values.courseId]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field data-invalid={!!errors.title} className="sm:col-span-2 lg:col-span-3">
        <FieldLabel>Title</FieldLabel>
        <Input
          value={values.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="e.g. Week 3 — Live Q&A"
          aria-invalid={!!errors.title}
        />
        <FieldError>{errors.title}</FieldError>
      </Field>
      <Field className="sm:col-span-2 lg:col-span-3">
        <FieldLabel>Description</FieldLabel>
        <Textarea
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional — shown to enrolled students."
          rows={2}
        />
      </Field>
      <Field data-invalid={!!errors.courseId}>
        <FieldLabel>Course</FieldLabel>
        <select
          className={selectClass}
          value={values.courseId}
          onChange={(e) => set({ courseId: e.target.value, batchId: '' })}
          aria-invalid={!!errors.courseId}
        >
          <option value="">Choose course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError>{errors.courseId}</FieldError>
      </Field>
      <Field>
        <FieldLabel>Batch</FieldLabel>
        <select
          className={selectClass}
          value={values.batchId}
          onChange={(e) => set({ batchId: e.target.value })}
          disabled={!values.courseId}
        >
          <option value="">Course-wide (no batch)</option>
          {batchesForCourse.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>
      <Field data-invalid={!!errors.instructorId}>
        <FieldLabel>Instructor</FieldLabel>
        <select
          className={selectClass}
          value={values.instructorId}
          onChange={(e) => set({ instructorId: e.target.value })}
          aria-invalid={!!errors.instructorId}
        >
          <option value="">Choose instructor…</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <FieldError>{errors.instructorId}</FieldError>
      </Field>
      <Field data-invalid={!!errors.scheduledAt}>
        <FieldLabel>Date &amp; time</FieldLabel>
        <Input
          type="datetime-local"
          value={values.scheduledAt}
          onChange={(e) => set({ scheduledAt: e.target.value })}
          aria-invalid={!!errors.scheduledAt}
        />
        <FieldError>{errors.scheduledAt}</FieldError>
      </Field>
      <Field data-invalid={!!errors.durationMin}>
        <FieldLabel>Duration (min)</FieldLabel>
        <Input
          type="number"
          min={10}
          max={480}
          value={values.durationMin}
          onChange={(e) => set({ durationMin: e.target.value })}
          aria-invalid={!!errors.durationMin}
        />
        <FieldError>{errors.durationMin}</FieldError>
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function LiveClassManager({
  liveClasses,
  courses,
  instructors,
  batches,
}: {
  liveClasses: LiveClassRow[];
  courses: Choice[];
  instructors: Choice[];
  batches: BatchChoice[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [isCreating, startCreate] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isCancelling, startCancel] = useTransition();
  const [createValues, setCreateValues] = useState<FormValues>(emptyForm);
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues>(emptyForm);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  function validate(values: FormValues) {
    return createLiveClassSchema.safeParse(values);
  }

  function add() {
    const parsed = validate(createValues);
    if (!parsed.success) {
      setCreateErrors(firstFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setCreateErrors({});
    startCreate(async () => {
      const result = await createLiveClass(createValues);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not schedule the class.');
        return;
      }
      toast.success(`"${createValues.title}" scheduled.`);
      setCreateValues(emptyForm);
      router.refresh();
    });
  }

  function startEdit(row: LiveClassRow) {
    setEditingId(row.id);
    setEditErrors({});
    setEditValues({
      title: row.title,
      description: row.description ?? '',
      courseId: row.courseId,
      batchId: row.batchId ?? '',
      instructorId: row.instructorId,
      scheduledAt: toDateTimeLocal(row.scheduledAt),
      durationMin: String(row.durationMin),
    });
  }

  function saveEdit(id: string) {
    const parsed = validate(editValues);
    if (!parsed.success) {
      setEditErrors(firstFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }
    setEditErrors({});
    startSave(async () => {
      const result = await updateLiveClass({ id, ...editValues });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update the class.');
        return;
      }
      toast.success(`"${editValues.title}" updated.`);
      setEditingId(null);
      router.refresh();
    });
  }

  async function cancel(row: LiveClassRow) {
    const ok = await confirm({
      title: `Cancel "${row.title}"?`,
      description: 'Students will no longer see this session, and the Calendar event is removed.',
      confirmLabel: 'Cancel class',
      destructive: true,
    });
    if (!ok) return;
    setCancellingId(row.id);
    startCancel(async () => {
      const result = await cancelLiveClass(row.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not cancel the class.');
        setCancellingId(null);
        return;
      }
      toast.success(`"${row.title}" cancelled.`);
      setCancellingId(null);
      router.refresh();
    });
  }

  const active = liveClasses.filter((c) => c.status !== 'CANCELLED');

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Schedule a live class</h2>
        <LiveClassForm
          courses={courses}
          instructors={instructors}
          batches={batches}
          values={createValues}
          onChange={(v) => {
            setCreateValues(v);
            setCreateErrors({});
          }}
          onSubmit={add}
          submitLabel="Schedule"
          pending={isCreating}
          errors={createErrors}
        />
      </div>

      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">No live classes scheduled yet.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((row) => {
            const rowCancelling = isCancelling && cancellingId === row.id;
            return (
              <li key={row.id} className="rounded-lg border">
                {editingId === row.id ? (
                  <div className="p-4">
                    <LiveClassForm
                      courses={courses}
                      instructors={instructors}
                      batches={batches}
                      values={editValues}
                      onChange={(v) => {
                        setEditValues(v);
                        setEditErrors({});
                      }}
                      onSubmit={() => saveEdit(row.id)}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save"
                      pending={isSaving}
                      errors={editErrors}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.title}</span>
                        <Badge variant={row.status === 'LIVE' ? 'default' : 'secondary'}>
                          {row.status === 'LIVE' ? 'Live now' : formatSchedule(row.scheduledAt)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {row.courseTitle} · {row.instructorName} · {row.durationMin} min
                        {row.batchName && ` · ${row.batchName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {row.meetLink && (
                        <a
                          href={row.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}
                        >
                          Open Meet
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(row)}
                        disabled={rowCancelling}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancel(row)}
                        disabled={rowCancelling}
                      >
                        {rowCancelling ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
