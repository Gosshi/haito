import { NextResponse, type NextRequest } from 'next/server';

import { createMiddlewareClient } from './lib/supabase/middleware';

const AUTH_ROUTES = ['/login', '/signup'] as const;
const PROTECTED_ROUTES = ['/dashboard'] as const;

const isProtectedRoute = (pathname: string): boolean =>
  PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

const isAuthRoute = (pathname: string): boolean =>
  AUTH_ROUTES.some((route) => pathname === route);

const buildRedirectResponse = (response: NextResponse, url: URL): NextResponse => {
  const redirectResponse = NextResponse.redirect(url);

  for (const cookie of response.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return buildRedirectResponse(response, redirectUrl);
  }

  if (user && isAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return buildRedirectResponse(response, redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
