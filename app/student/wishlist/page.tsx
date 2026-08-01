import { Heart } from 'lucide-react';
import Link from 'next/link';

import { CourseCard } from '@/features/marketplace/components/CourseCard';
import { getWishlist } from '@/features/wishlist/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

export default async function WishlistPage() {
  const session = await requireRole(ROLES.STUDENT);
  const items = await getWishlist(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Heart />}
        title="Wishlist"
        description="Courses you've saved to revisit later."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/student/courses">Browse courses</Link>}
          />
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/60">
          <p className="font-medium">Your wishlist is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any course to save it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <CourseCard key={item.id} course={item.course} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
