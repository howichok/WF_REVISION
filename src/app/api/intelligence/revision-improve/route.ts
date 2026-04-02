import { NextResponse } from "next/server";
import { generateRevisionImprovementResponse } from "@/lib/intelligence/revision-improve";
import type { RevisionImprovementRequest } from "@/lib/intelligence/types";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validateRequest(
  value: unknown
): RevisionImprovementRequest | { error: string; status?: number } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid revision improvement payload." };
  }

  const payload = value as Partial<RevisionImprovementRequest>;
  if (payload.mode !== "revision-improve") {
    return { error: "Unsupported improvement mode." };
  }

  if (typeof payload.questionId !== "string" || !payload.questionId.trim()) {
    return { error: "Question id is required." };
  }

  if (typeof payload.answer !== "string" || payload.answer.trim().length < 8) {
    return { error: "Answer is too short to improve reliably." };
  }

  if (
    payload.outputMode !== undefined &&
    payload.outputMode !== "commentator" &&
    payload.outputMode !== "diff"
  ) {
    return { error: "Unsupported improvement output mode." };
  }

  return {
    mode: "revision-improve",
    questionId: payload.questionId.trim(),
    answer: payload.answer.trim().slice(0, 4000),
    outputMode: payload.outputMode ?? "commentator",
  };
}

export async function POST(request: Request) {
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
    return NextResponse.json(await generateRevisionImprovementResponse(validated));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unknown revision question:")) {
      return jsonError(error.message, 404);
    }

    return jsonError(
      error instanceof Error ? error.message : "Unable to improve the submitted answer.",
      500
    );
  }
}
