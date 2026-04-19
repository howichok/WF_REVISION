import { NextResponse } from "next/server";
import {
  SITE_GATE_COOKIE,
  isSiteGateEnabled,
  siteGateTokenFromParts,
} from "@/lib/site-gate";
import { applyRateLimit, jsonRateLimitResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  // Brute-force protection: 5 attempts per minute per IP.
  const rl = applyRateLimit(request, "site-gate", 5, 60_000);
  if (!rl.ok) {
    return jsonRateLimitResponse(rl.retryAfterSec);
  }

  if (!isSiteGateEnabled()) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const expected = process.env.SITE_GATE_PASSWORD?.trim() ?? "";
  const submitted = typeof body.password === "string" ? body.password.trim() : "";

  if (!submitted || submitted !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const keyMaterial =
    process.env.SITE_GATE_SECRET?.trim() || process.env.SITE_GATE_PASSWORD?.trim() || "";
  const token = await siteGateTokenFromParts(submitted, keyMaterial);

  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(SITE_GATE_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
