import { CourseCard } from '@/features/marketplace/components/CourseCard';
import { MarketplaceFilters } from '@/features/marketplace/components/MarketplaceFilters';
import { getMarketplaceFilterOptions, getPublishedCourses } from '@/features/marketplace/server/data';
import { parseCourseFilters } from '@/features/marketplace/schemas';
import { Reveal } from '@/shared/components/public/Reveal';
import { StaggerGroup, StaggerItem } from '@/shared/components/public/Stagger';

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseCourseFilters(await searchParams);

  const [courses, filterOptions] = await Promise.all([
    getPublishedCourses(filters),
    getMarketplaceFilterOptions(),
  ]);

  return (
    <div>
      <section className="border-b bg-linear-to-br from-brand-blue via-indigo-600 to-violet-600 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <Reveal>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Course catalog
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              Browse a course, then request enrollment — our team follows up to get you set up. No
              upfront payment required.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <MarketplaceFilters
            filters={filters}
            categories={filterOptions.categories}
            languages={filterOptions.languages}
          />
        </Reveal>

        {courses.length === 0 ? (
          <Reveal className="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/60">
            <p className="font-medium">No courses match your filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing filters or searching for something else.
            </p>
          </Reveal>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'}
            </p>
            <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <StaggerItem key={course.id}>
                  <CourseCard course={course} hrefBase="/courses" showWishlist={false} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </>
        )}
      </div>
    </div>
  );
}
