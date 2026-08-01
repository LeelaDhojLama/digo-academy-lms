'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createBatch, deleteBatch, updateBatch } from '@/features/cohorts/server/actions';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';

export interface BatchRow {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  instructorId: string | null;
  instructorName: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  enrollmentCount: number;
  liveClassCount: number;
}

interface Choice {
  id: string;
  name: string;
}

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

interface FormValues {
  name: string;
  courseId: string;
  instructorId: string;
  startDate: string;
  endDate: string;
  capacity: string;
}

const emptyForm: FormValues = {
  name: '',
  courseId: '',
  instructorId: '',
  startDate: '',
  endDate: '',
  capacity: '',
};

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

function BatchForm({
  courses,
  instructors,
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
}: {
  courses: Choice[];
  instructors: Choice[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  pending: boolean;
}) {
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Spring 2026 Cohort"
        />
      </Field>
      <Field>
        <FieldLabel>Course</FieldLabel>
        <select
          className={selectClass}
          value={values.courseId}
          onChange={(e) => set({ courseId: e.target.value })}
        >
          <option value="">Choose course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <FieldLabel>Instructor</FieldLabel>
        <select
          className={selectClass}
          value={values.instructorId}
          onChange={(e) => set({ instructorId: e.target.value })}
        >
          <option value="">Unassigned</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <FieldLabel>Start date</FieldLabel>
        <Input
          type="date"
          value={values.startDate}
          onChange={(e) => set({ startDate: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>End date</FieldLabel>
        <Input
          type="date"
          value={values.endDate}
          onChange={(e) => set({ endDate: e.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>Capacity</FieldLabel>
        <Input
          type="number"
          min={1}
          value={values.capacity}
          onChange={(e) => set({ capacity: e.target.value })}
          placeholder="Optional"
        />
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

export function BatchManager({
  batches,
  courses,
  instructors,
}: {
  batches: BatchRow[];
  courses: Choice[];
  instructors: Choice[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createValues, setCreateValues] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues>(emptyForm);

  function add() {
    startTransition(async () => {
      const result = await createBatch(createValues);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not create batch.');
        return;
      }
      toast.success('Batch created.');
      setCreateValues(emptyForm);
      router.refresh();
    });
  }

  function startEdit(row: BatchRow) {
    setEditingId(row.id);
    setEditValues({
      name: row.name,
      courseId: row.courseId,
      instructorId: row.instructorId ?? '',
      startDate: toDateInput(row.startDate),
      endDate: toDateInput(row.endDate),
      capacity: row.capacity != null ? String(row.capacity) : '',
    });
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const result = await updateBatch({ id, ...editValues });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update batch.');
        return;
      }
      toast.success('Batch updated.');
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(row: BatchRow) {
    if (!confirm(`Delete batch “${row.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteBatch(row.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete batch.');
        return;
      }
      toast.success('Batch deleted.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Add a batch</h2>
        <BatchForm
          courses={courses}
          instructors={instructors}
          values={createValues}
          onChange={setCreateValues}
          onSubmit={add}
          submitLabel="Add batch"
          pending={isPending}
        />
      </div>

      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No batches yet.</p>
      ) : (
        <ul className="space-y-2">
          {batches.map((row) => (
            <li key={row.id} className="rounded-lg border">
              {editingId === row.id ? (
                <div className="p-4">
                  <BatchForm
                    courses={courses}
                    instructors={instructors}
                    values={editValues}
                    onChange={setEditValues}
                    onSubmit={() => saveEdit(row.id)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Save"
                    pending={isPending}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      {row.enrollmentCount > 0 && (
                        <Badge variant="secondary">{row.enrollmentCount} enrolled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.courseTitle} · {row.instructorName ?? 'No instructor'}
                      {row.capacity != null && ` · cap ${row.capacity}`}
                      {row.liveClassCount > 0 && ` · ${row.liveClassCount} live classes`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(row)}
                      disabled={isPending}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(row)}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
