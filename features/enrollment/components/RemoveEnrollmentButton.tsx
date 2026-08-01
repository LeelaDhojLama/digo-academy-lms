'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { removeEnrollment } from '@/features/enrollment/server/actions';
import { Button } from '@/shared/components/ui/button';

export function RemoveEnrollmentButton({
  enrollmentId,
  studentName,
}: {
  enrollmentId: string;
  studentName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm(`Remove ${studentName}'s enrollment? This also deletes its payment records.`)) {
      return;
    }
    startTransition(async () => {
      const result = await removeEnrollment(enrollmentId);
      if (!result.ok) {
        toast.error(result.error ?? 'Could not remove enrollment.');
        return;
      }
      toast.success('Enrollment removed.');
      router.push('/admin/enrollments');
      router.refresh();
    });
  }

  return (
    <Button variant="destructive" size="sm" disabled={isPending} onClick={remove}>
      Remove enrollment
    </Button>
  );
}
