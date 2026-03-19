import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const cookieName =
    process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token.dashboard'
      : 'next-auth.session-token.dashboard';

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: cookieName,
  });
  const { pathname } = req.nextUrl;

  // Protect Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Check for Admin Role
    const userRole = (token.user as any)?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      // If logged in but not admin, maybe redirect to a 'not authorized' page or back to login with error
      // For now preventing access
      return NextResponse.redirect(
        new URL('/auth/login?error=AccessDenied', req.url),
      );
    }
  }

  // Redirect from Root to Dashboard (or Login)
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // Prevent logged-in users from visiting Login page
  if (pathname.startsWith('/auth/login')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
