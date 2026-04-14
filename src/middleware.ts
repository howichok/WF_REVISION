import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_GATE_COOKIE, isSiteGateEnabled, siteGateExpectedToken } from "@/lib/site-gate";

/** Old revision branches — funnel everyone into the two-mode hub. */
const LEGACY_REVISION_PATHS = new Set([
  "/revision/diagnostic",
  "/revision/weak-areas",
  "/revision/paper-1",
  "/revision/paper-2",
  "/revision/mixed",
  "/revision/progress",
]);

function isLocalHost(host: string) {
  const h = host.toLowerCase();
  return h.startsWith("localhost:") || h === "localhost" || h.startsWith("127.0.0.1");
}

function siteGateBypass(pathname: string) {
  if (pathname.startsWith("/site-access")) {
    return true;
  }
  if (pathname.startsWith("/api/site-gate")) {
    return true;
  }
  if (pathname.startsWith("/auth")) {
    return true;
  }
  if (pathname.startsWith("/legal")) {
    return true;
  }
  if (pathname.startsWith("/api/health")) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  if (process.env.NODE_ENV === "production" && !isLocalHost(host)) {
    const proto = request.headers.get("x-forwarded-proto");
    if (proto === "http") {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  if (LEGACY_REVISION_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/revision", request.url));
  }

  if (pathname === "/revision/quick-quiz" && !searchParams.has("topics")) {
    return NextResponse.redirect(new URL("/revision/topics?mode=simple", request.url));
  }

  if (isSiteGateEnabled() && !siteGateBypass(pathname)) {
    const cookie = request.cookies.get(SITE_GATE_COOKIE)?.value;
    const expected = await siteGateExpectedToken();
    if (expected && cookie !== expected) {
      return NextResponse.redirect(new URL("/site-access", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
