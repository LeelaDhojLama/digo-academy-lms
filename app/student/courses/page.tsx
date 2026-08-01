import { Compass } from 'lucide-react';

import { CourseCard } from '@/features/marketplace/components/CourseCard';
import { MarketplaceFilters } from '@/features/marketplace/components/MarketplaceFilters';
import { getMarketplaceFilterOptions, getPublishedCourses } from '@/features/marketplace/server/data';
import { parseCourseFilters } from '@/features/marketplace/schemas';
import { getWishlistedCourseIds } from '@/features/wishlist/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function BrowseCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole(ROLES.STUDENT);
  const filters = parseCourseFilters(await searchParams);

  const [courses, filterOptions, wishlistedIds] = await Promise.all([
    getPublishedCourses(filters),
    getMarketplaceFilterOptions(),
    getWishlistedCourseIds(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Compass />}
        title="Browse courses"
        description="Find a course, then request enrollment — our team follows up to get you set up."
      />

      <MarketplaceFilters
        filters={filters}
        categories={filterOptions.categories}
        languages={filterOptions.languages}
      />

      {courses.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/60">
          <p className="font-medium">No courses match your filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing filters or searching for something else.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                wishlisted={wishlistedIds.has(course.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
