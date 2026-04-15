import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('rams_session')?.value;
  const path = request.nextUrl.pathname;

  // Public routes - no auth needed
  if (
    path === '/' ||
    path === '/login' ||
    path.startsWith('/curriculum') ||
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/logo') ||
    path === '/favicon.ico'
  ) {
    // Redirect logged-in users away from login page
    if (path === '/login' && token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - just check cookie presence
  // Actual verification happens server-side
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
