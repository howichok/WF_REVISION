import { NextResponse } from "next/server";
import { generateGroundedResearchAnswer } from "@/lib/research/google-grounding";
import { recordRevisionRouteMetric } from "@/lib/revision-runtime";
import type { GroundedResearchRequest } from "@/lib/research/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

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
    query,
  };
}

export async function POST(request: Request) {
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
