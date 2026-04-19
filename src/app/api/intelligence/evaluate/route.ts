import { NextResponse } from "next/server";
import { evaluateIntelligenceRequest } from "@/lib/intelligence";
import {
  applyRateLimit,
  bodyTooLarge,
  getApiUser,
  jsonError,
  jsonRateLimitResponse,
} from "@/lib/api-helpers";
import type {
  CommunityEvaluationRequest,
  IntelligenceEvaluationRequest,
  RevisionEvaluationRequest,
} from "@/lib/intelligence/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64_000;

function isRevisionRequest(value: unknown): value is RevisionEvaluationRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<RevisionEvaluationRequest>;

  return (
    payload.mode === "revision-answer" &&
    typeof payload.questionId === "string" &&
    typeof payload.answer === "string"
  );
}

function isCommunityRequest(value: unknown): value is CommunityEvaluationRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CommunityEvaluationRequest>;

  return (
    payload.mode === "community-content" &&
    typeof payload.content === "string" &&
    (payload.topicId === undefined || typeof payload.topicId === "string") &&
    (payload.contentType === undefined ||
      payload.contentType === "post" ||
      payload.contentType === "reply")
  );
}

function validateRequest(
  value: unknown
): IntelligenceEvaluationRequest | { error: string; status?: number } {
  if (isRevisionRequest(value)) {
    if (value.answer.trim().length < 8) {
      return { error: "Answer is too short to evaluate reliably." };
    }

    return {
      mode: "revision-answer",
      questionId: value.questionId,
      answer: value.answer.trim().slice(0, 4000),
    };
  }

  if (isCommunityRequest(value)) {
    if (value.content.trim().length < 3) {
      return { error: "Content is too short to evaluate." };
    }

    return {
      mode: "community-content",
      content: value.content.trim().slice(0, 5000),
      topicId: value.topicId,
      contentType: value.contentType,
    };
  }

  return { error: "Invalid intelligence evaluation payload." };
}

export async function POST(request: Request) {
  const rl = applyRateLimit(request, "evaluate", 20);
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
    return NextResponse.json(evaluateIntelligenceRequest(validated));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unknown revision question:")) {
      return jsonError(error.message, 404);
    }

    return jsonError(
      error instanceof Error ? error.message : "Unable to evaluate the submitted content.",
      500
    );
  }
}
