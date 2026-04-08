import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Old revision branches — funnel everyone into the two-mode hub. */
const LEGACY_REVISION_PATHS = new Set([
  "/revision/diagnostic",
  "/revision/weak-areas",
  "/revision/paper-1",
  "/revision/paper-2",
  "/revision/mixed",
  "/revision/progress",
]);

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (LEGACY_REVISION_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/revision", request.url));
  }

  if (pathname === "/revision/quick-quiz" && !searchParams.has("topics")) {
    return NextResponse.redirect(new URL("/revision/topics?mode=simple", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/revision/diagnostic",
    "/revision/diagnostic/:path*",
    "/revision/weak-areas",
    "/revision/weak-areas/:path*",
    "/revision/paper-1",
    "/revision/paper-2",
    "/revision/mixed",
    "/revision/progress",
    "/revision/quick-quiz",
  ],
};
