import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge-compatible middleware for route protection.
 * Checks for the NextAuth session cookie (presence only).
 * Full JWT verification happens in the /api/analyze/* proxy routes.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes without authentication
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // NextAuth v5 uses 'authjs.session-token'; v4 used 'next-auth.session-token'
  const sessionCookie =
    req.cookies.get('authjs.session-token') ??
    req.cookies.get('__Secure-authjs.session-token') ??
    req.cookies.get('next-auth.session-token') ??
    req.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
