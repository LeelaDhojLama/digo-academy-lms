'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  createLearningPlan,
  deleteLearningPlan,
  updateLearningPlan,
} from '@/features/cohorts/server/actions';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

export interface LearningPlanRow {
  id: string;
  name: string;
  courseId: string;
  courseTitle: string;
  description: string | null;
  enrollmentCount: number;
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
  description: string;
}

const emptyForm: FormValues = { name: '', courseId: '', description: '' };

function PlanForm({
  courses,
  values,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
}: {
  courses: Choice[];
  values: FormValues;
  onChange: (values: FormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
  pending: boolean;
}) {
  const set = (patch: Partial<FormValues>) => onChange({ ...values, ...patch });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Self-paced track"
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
      <Field className="sm:col-span-2">
        <FieldLabel>Description</FieldLabel>
        <Textarea
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional summary of this plan."
        />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
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

export function LearningPlanManager({
  plans,
  courses,
}: {
  plans: LearningPlanRow[];
  courses: Choice[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createValues, setCreateValues] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<FormValues>(emptyForm);

  function add() {
    startTransition(async () => {
      const result = await createLearningPlan(createValues);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not create plan.');
        return;
      }
      toast.success('Learning plan created.');
      setCreateValues(emptyForm);
      router.refresh();
    });
  }

  function startEdit(row: LearningPlanRow) {
    setEditingId(row.id);
    setEditValues({
      name: row.name,
      courseId: row.courseId,
      description: row.description ?? '',
    });
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      const result = await updateLearningPlan({ id, ...editValues });
      if (!result.ok) {
        toast.error(result.error ?? 'Could not update plan.');
        return;
      }
      toast.success('Learning plan updated.');
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(row: LearningPlanRow) {
    if (!confirm(`Delete learning plan “${row.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteLearningPlan(row.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete plan.');
        return;
      }
      toast.success('Learning plan deleted.');
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-sm font-medium">Add a learning plan</h2>
        <PlanForm
          courses={courses}
          values={createValues}
          onChange={setCreateValues}
          onSubmit={add}
          submitLabel="Add plan"
          pending={isPending}
        />
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No learning plans yet.</p>
      ) : (
        <ul className="space-y-2">
          {plans.map((row) => (
            <li key={row.id} className="rounded-lg border">
              {editingId === row.id ? (
                <div className="p-4">
                  <PlanForm
                    courses={courses}
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
                      {row.courseTitle}
                      {row.description ? ` · ${row.description}` : ''}
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
