import { NextResponse } from "next/server";
import { generateGroundedResearchAnswer } from "@/lib/research/google-grounding";
import { recordRevisionRouteMetric } from "@/lib/revision-runtime";
import {
  applyRateLimit,
  bodyTooLarge,
  getApiUser,
  jsonError,
  jsonRateLimitResponse,
} from "@/lib/api-helpers";
import type { GroundedResearchRequest } from "@/lib/research/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_000;

function validateRequest(value: unknown): GroundedResearchRequest | { error: string; status?: number } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid grounded research payload." };
  }

  const payload = value as Partial<GroundedResearchRequest>;

  if (typeof payload.topicId !== "string" || typeof payload.query !== "string") {
    return { error: "Grounded research requires a topicId and query." };
  }

  const query = payload.query.trim();
  if (query.length < 4) {
    return { error: "Grounded research query is too short." };
  }

  return {
    topicId: payload.topicId.trim(),
    query: query.slice(0, 500),
  };
}

export async function POST(request: Request) {
  const rl = applyRateLimit(request, "grounded-answer", 12);
  if (!rl.ok) {
    return jsonRateLimitResponse(rl.retryAfterSec);
  }

  const user = await getApiUser(request);
  if (!user) {
    const hasConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (hasConfig) {
      return jsonError("Authentication required.", 401);
    }
  }

  if (bodyTooLarge(request, MAX_BODY_BYTES)) {
    return jsonError("Payload too large.", 413);
  }

  const startedAt = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.");
  }

  const validated = validateRequest(body);
  if ("error" in validated) {
    return jsonError(validated.error, validated.status);
  }

  try {
    const response = await generateGroundedResearchAnswer(validated);
    recordRevisionRouteMetric("grounded-answer", Date.now() - startedAt, true);
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate a grounded research answer right now.";
    recordRevisionRouteMetric("grounded-answer", Date.now() - startedAt, false);

    if (message.startsWith("Missing GEMINI_API_KEY")) {
      return jsonError(message, 503);
    }

    if (message.startsWith("Unknown topic:")) {
      return jsonError(message, 404);
    }

    return jsonError(message, 500);
  }
}
