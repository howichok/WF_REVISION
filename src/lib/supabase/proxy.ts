import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseConfig } from "./config";

const ANON_ONLY_PATHS = new Set([
  "/",
  "/auth",
]);

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/home") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/revision") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding")
  );
}

function buildRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return url;
}

async function resolveNextRoute(
  request: NextRequest,
  response: NextResponse,
  userId: string,
  pathname: string,
  supabaseUrl: string,
  supabasePublishableKey: string
) {
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: onboardingRow } = await supabase
    .from("user_onboarding")
    .select("weak_areas, completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  const weakAreas = onboardingRow?.weak_areas ?? [];
  const nextPath =
    weakAreas.length === 0
      ? "/onboarding"
      : onboardingRow?.completed_at
        ? "/home"
        : "/onboarding/focus";

  if (ANON_ONLY_PATHS.has(pathname)) {
    return NextResponse.redirect(buildRedirect(request, nextPath));
  }

  if (pathname === "/onboarding" && nextPath !== "/onboarding") {
    return NextResponse.redirect(buildRedirect(request, nextPath));
  }

  if (pathname === "/onboarding/focus" && nextPath !== "/onboarding/focus") {
    return NextResponse.redirect(buildRedirect(request, nextPath));
  }

  if (
    (pathname.startsWith("/home") ||
      pathname.startsWith("/library") ||
      pathname.startsWith("/revision") ||
      pathname.startsWith("/settings")) &&
    nextPath !== "/home"
  ) {
    return NextResponse.redirect(buildRedirect(request, nextPath));
  }

  return response;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const redirectUrl = buildRedirect(request, "/auth");
      redirectUrl.searchParams.set(
        "error",
        "Supabase is not configured for this environment."
      );
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const redirectUrl = buildRedirect(request, "/auth");
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  return resolveNextRoute(
    request,
    response,
    user.id,
    request.nextUrl.pathname,
    config.supabaseUrl,
    config.supabasePublishableKey
  );
}
