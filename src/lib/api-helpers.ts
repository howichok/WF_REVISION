import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { checkRateLimit, getClientIp } from "@/lib/api-rate-limit";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonRateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests — please slow down.", retryAfterSec },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
} as const;

function sseEventText(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function sseError(message: string, status = 400) {
  return new Response(sseEventText("error", { message }), {
    status,
    headers: SSE_HEADERS,
  });
}

export function sseRateLimitResponse(retryAfterSec: number) {
  return new Response(
    sseEventText("error", { message: "Too many requests — please slow down.", retryAfterSec }),
    {
      status: 429,
      headers: { ...SSE_HEADERS, "Retry-After": String(retryAfterSec) },
    },
  );
}

export function applyRateLimit(
  request: Request,
  bucket: string,
  maxPerWindow: number,
  windowMs = 60_000,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const ip = getClientIp(request);
  return checkRateLimit(`${bucket}:${ip}`, maxPerWindow, windowMs);
}

export function bodyTooLarge(request: Request, maxBytes: number): boolean {
  const len = Number(request.headers.get("content-length") ?? "0");
  return len > maxBytes;
}

/**
 * Returns the authenticated Supabase user for an API request, or null.
 * When Supabase is not configured the function always returns null (dev/local mode — allow through).
 * When Supabase IS configured but the caller is not authenticated, returns null — callers should
 * respond with 401 to prevent unauthenticated use of AI endpoints.
 */
export async function getApiUser(request: Request) {
  void request; // kept for potential future header-based token auth
  if (!getSupabaseConfig()) {
    return null;
  }
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
