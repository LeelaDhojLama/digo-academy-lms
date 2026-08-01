import Link from 'next/link';

import { getSession } from '@/lib/auth/session';
import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';
import { Button } from '@/shared/components/ui/button';
import { ROLE_HOME, type Role } from '@/shared/constants/roles';

/**
 * Public marketing/catalog header. Auth-aware: signed-in visitors get a link to
 * their dashboard; guests get sign-in / get-started actions.
 */
export async function PublicHeader() {
  const session = await getSession();
  const home = session ? (ROLE_HOME[session.user.role as Role] ?? '/dashboard') : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Digo Academy home" className="shrink-0">
          <BrandLogo className="h-8" />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/courses"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Courses
          </Link>
          <Link
            href="/#how-it-works"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="/register/instructor"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Teach on Digo
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {home ? (
            <Button
              className="rounded-full bg-linear-to-r from-brand-blue to-violet-600 text-white shadow-sm transition-transform hover:scale-105 hover:opacity-95"
              nativeButton={false}
              render={<Link href={home}>Go to dashboard</Link>}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                className="rounded-full"
                nativeButton={false}
                render={<Link href="/login">Sign in</Link>}
              />
              <Button
                className="rounded-full bg-linear-to-r from-brand-blue to-violet-600 text-white shadow-sm transition-transform hover:scale-105 hover:opacity-95"
                nativeButton={false}
                render={<Link href="/register">Get started</Link>}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
