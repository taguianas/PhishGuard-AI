import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge-compatible route protection.
 * Checks for the NextAuth session cookie (presence only).
 * Full JWT verification happens in the /api/analyze/* proxy routes.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    '/login',
    '/register',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/url-analyzer',
    '/email-analyzer',
    '/attachment-analyzer',
    '/qr-analyzer',
    '/api/analyze',
  ];

  if (pathname === '/' || publicPaths.some((segment) => pathname.startsWith(segment))) {
    return NextResponse.next();
  }

  const sessionCookie =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-authjs.session-token') ??
    req.cookies.get('next-auth.session-token') ??
    req.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
