import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/home";
  }

  return nextPath;
}

function redirectWithError(requestUrl: URL, message: string) {
  const errorUrl = new URL("/auth", requestUrl.origin);
  errorUrl.searchParams.set("error", message);
  return NextResponse.redirect(errorUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const providerError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (!getSupabaseConfig()) {
    return redirectWithError(
      requestUrl,
      "Supabase is not configured for this environment."
    );
  }

  if (providerError) {
    return redirectWithError(requestUrl, providerError);
  }

  if (!code) {
    return redirectWithError(
      requestUrl,
      "The sign-in link is missing or has already been used."
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectWithError(requestUrl, error.message);
    }
  } catch (error) {
    return redirectWithError(
      requestUrl,
      error instanceof Error ? error.message : "Unable to finish authentication."
    );
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
