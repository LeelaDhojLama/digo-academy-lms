import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Optimistic auth gate. Per the Next.js docs, Proxy is not a full authorization
 * solution — it only does a fast session-cookie presence check to keep signed-out
 * users out of the dashboards. Real role/authorization checks run in the pages and
 * Server Actions themselves (see lib/auth/session.ts `requireRole`).
 */
export function proxy(request: NextRequest) {
  const hasSession = getSessionCookie(request);
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/instructor/:path*', '/admin/:path*', '/settings/:path*'],
};
