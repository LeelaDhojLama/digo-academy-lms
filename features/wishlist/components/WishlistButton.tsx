'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { toggleWishlist } from '@/features/wishlist/server/actions';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

/**
 * Heart toggle to save/unsave a course. Optimistically flips local state and
 * reconciles with the server result. Two variants: a compact icon (for cards)
 * and a full labelled button (for the course detail page).
 */
export function WishlistButton({
  courseId,
  initialWishlisted,
  variant = 'icon',
  className,
}: {
  courseId: string;
  initialWishlisted: boolean;
  variant?: 'icon' | 'full';
  className?: string;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const previous = wishlisted;
    setWishlisted(!previous);
    startTransition(async () => {
      const result = await toggleWishlist(courseId);
      if (!result.ok) {
        setWishlisted(previous);
        toast.error(result.error ?? 'Could not update wishlist.');
        return;
      }
      setWishlisted(result.wishlisted ?? !previous);
      router.refresh();
    });
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'flex size-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-primary disabled:opacity-60',
          wishlisted && 'text-primary',
          className
        )}
      >
        <Heart className={cn('size-4', wishlisted && 'fill-current')} />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={wishlisted}
      className={className}
    >
      <Heart className={cn('size-4', wishlisted && 'fill-current text-primary')} />
      {wishlisted ? 'Saved' : 'Save for later'}
    </Button>
  );
}
