import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'curriclio_session';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const path = request.nextUrl.pathname;

  if (
    path === '/' ||
    path === '/login' ||
    path === '/signup' ||
    path.startsWith('/invite/') ||
    path.startsWith('/join/') ||
    path.startsWith('/docs/') ||
    path.startsWith('/curriculum') ||
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path === '/favicon.ico' ||
    path === '/icon.svg'
  ) {
    if ((path === '/login' || path === '/signup') && token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
