import { NextResponse } from "next/server";
import { generateTopicIntelligenceResponse } from "@/lib/intelligence";
import {
  applyRateLimit,
  bodyTooLarge,
  getApiUser,
  jsonError,
  jsonRateLimitResponse,
} from "@/lib/api-helpers";
import type {
  TopicIntelligenceIntent,
  TopicIntelligenceRequest,
} from "@/lib/intelligence/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64_000;

const ALLOWED_INTENTS: TopicIntelligenceIntent[] = [
  "hint",
  "local-answer",
  "grounded-answer",
  "answer-check",
  "practice-question",
  "resource-pick",
  "misconception-fix",
];

function validateRequest(
  value: unknown
): TopicIntelligenceRequest | { error: string; status?: number } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid topic assistant payload." };
  }

  const payload = value as Partial<TopicIntelligenceRequest>;
  if (typeof payload.topicId !== "string" || !payload.topicId.trim()) {
    return { error: "Topic id is required." };
  }

  if (payload.query !== undefined && typeof payload.query !== "string") {
    return { error: "Query must be a string." };
  }

  if (
    payload.overrideIntent !== undefined &&
    !ALLOWED_INTENTS.includes(payload.overrideIntent)
  ) {
    return { error: "Unsupported assistant intent." };
  }

  if (payload.draftAnswer !== undefined && typeof payload.draftAnswer !== "string") {
    return { error: "Draft answer must be a string." };
  }

  return {
    topicId: payload.topicId.trim(),
    query: typeof payload.query === "string" ? payload.query.trim().slice(0, 500) : "",
    overrideIntent: payload.overrideIntent,
    draftAnswer: payload.draftAnswer?.trim().slice(0, 4000),
  };
}

export async function POST(request: Request) {
  const rl = applyRateLimit(request, "topic-assistant", 15);
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
    const response = await generateTopicIntelligenceResponse(validated);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unknown topic:")) {
      return jsonError(error.message, 404);
    }

    return jsonError(
      error instanceof Error ? error.message : "Unable to run the topic assistant right now.",
      500
    );
  }
}
