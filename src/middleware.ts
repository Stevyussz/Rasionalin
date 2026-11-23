import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "kejarsnbt_session";

const PROTECTED_PATHS = [
  "/",
  "/tutor",
  "/study",
  "/vault",
  "/graveyard",
  "/simulation",
  "/settings",
  "/neural",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSessionCookie = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (pathname === "/login" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isProtectedPath(pathname) && !hasSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/tutor/:path*",
    "/study/:path*",
    "/vault/:path*",
    "/graveyard/:path*",
    "/simulation/:path*",
    "/settings/:path*",
    "/neural/:path*",
  ],
};
