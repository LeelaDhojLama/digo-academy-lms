'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { deleteCourse } from '@/features/courses/server/actions';
import { Button } from '@/shared/components/ui/button';

export function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (
      !confirm(
        `Delete "${courseTitle}"? This permanently removes the course and its curriculum. This cannot be undone.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteCourse(courseId);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not delete course.');
        return;
      }
      toast.success('Course deleted.');
      router.push('/admin/courses');
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={remove}>
      <Trash2 />
      Delete
    </Button>
  );
}
