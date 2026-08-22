'use client';

import { useRouter } from 'next/navigation';

import type { SegmentCourse } from '@/features/audience/server/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

/** Course dropdown that navigates to `?courseId=…` (resetting any filter). */
export function CoursePicker({ courses, value }: { courses: SegmentCourse[]; value?: string }) {
  const router = useRouter();

  return (
    <Select
      value={value ?? null}
      onValueChange={(next) =>
        router.push(next ? `/admin/learning-paths?courseId=${next}` : '/admin/learning-paths')
      }
    >
      <SelectTrigger className="w-full max-w-md">
        <SelectValue placeholder="Select a course…" />
      </SelectTrigger>
      <SelectContent>
        {courses.map((course) => {
          const signals =
            course._count.enrollments + course._count.inquiries + course._count.wishlistedBy;
          return (
            <SelectItem key={course.id} value={course.id}>
              {course.title}
              {course.category ? ` · ${course.category.name}` : ''}
              {signals > 0 ? ` (${signals})` : ''}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
