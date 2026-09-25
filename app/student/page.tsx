import { Award, BookOpen, Compass, Heart, Inbox } from 'lucide-react';
import Link from 'next/link';

import {
  getStudentEnrollmentCount,
  getStudentOpenInquiryCount,
} from '@/features/enrollment/server/data';
import { getStudentUpcomingBatches } from '@/features/live/server/data';
import { getWishlistCount } from '@/features/wishlist/server/data';
import { requireRole } from '@/lib/auth/session';
import { NextLiveClassCard } from '@/shared/components/dashboard/NextLiveClassCard';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { WidgetCard } from '@/shared/components/dashboard/WidgetCard';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

export default async function StudentDashboardPage() {
  const session = await requireRole(ROLES.STUDENT);

  const [enrolled, wishlist, openInquiries, { featured: nextLiveClass }] = await Promise.all([
    getStudentEnrollmentCount(session.user.id),
    getWishlistCount(session.user.id),
    getStudentOpenInquiryCount(session.user.id),
    getStudentUpcomingBatches(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${session.user.name.split(' ')[0]}`}
        description="Your learning at a glance. Browse the catalog to enroll in new courses."
        action={
          <Button nativeButton={false} render={<Link href="/student/courses">Browse courses</Link>} />
        }
      />

      {nextLiveClass?.nextOccurrence && (
        <NextLiveClassCard
          batchName={nextLiveClass.name}
          courseTitle={nextLiveClass.courseTitle}
          meetLink={nextLiveClass.meetLink}
          nextOccurrence={nextLiveClass.nextOccurrence}
          isLive={nextLiveClass.isLive}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/student/courses" className="block">
          <WidgetCard
            title="Enrolled courses"
            value={enrolled}
            hint="Courses you're taking."
            icon={<BookOpen />}
            accent="blue"
          />
        </Link>
        <Link href="/student/inquiries" className="block">
          <WidgetCard
            title="Open inquiries"
            value={openInquiries}
            hint="Enrollment requests in progress."
            icon={<Inbox />}
            accent="amber"
          />
        </Link>
        <Link href="/student/wishlist" className="block">
          <WidgetCard
            title="Wishlist"
            value={wishlist}
            hint="Saved for later."
            icon={<Heart />}
            accent="coral"
          />
        </Link>
        <WidgetCard
          title="Certificates"
          value={0}
          hint="Earned on course completion."
          icon={<Award />}
          accent="emerald"
        />
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue [&_svg]:size-5">
            <Compass />
          </span>
          <div className="space-y-1">
            <h2 className="font-heading font-semibold">Ready to learn something new?</h2>
            <p className="text-sm text-muted-foreground">
              Explore live cohorts and self-paced courses. Request enrollment and our team gets you
              set up.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/student/courses">Explore the catalog</Link>}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
