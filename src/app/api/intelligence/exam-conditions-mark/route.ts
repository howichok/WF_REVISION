import { NextResponse } from "next/server";
import {
  evaluateExamConditionsSession,
  EXAM_CONDITIONS_SESSION_MAX_QUESTIONS,
  mergeGeminiExamMarking,
  type ExamConditionsQuestion,
} from "@/lib/exam-conditions";
import {
  buildServerMarkSchemeSummary,
  compactCommandWordForMarking,
  getCanonicalExpectation,
} from "@/lib/exam-marking-rubric";
import { getLocalSharedCurriculumSnapshot } from "@/lib/shared-curriculum";
import {
  generateExamSessionGeminiMarks,
  isGeminiExamMarkingConfigured,
} from "@/lib/research/gemini-exam-session-mark";

export const runtime = "nodejs";

const MAX_QUESTIONS = EXAM_CONDITIONS_SESSION_MAX_QUESTIONS;
const MAX_BODY_BYTES = 900_000;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseQuestions(raw: unknown): ExamConditionsQuestion[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const out: ExamConditionsQuestion[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const q = item as Partial<ExamConditionsQuestion>;
    if (
      typeof q.id !== "string" ||
      typeof q.marks !== "number" ||
      typeof q.prompt !== "string" ||
      typeof q.expectation !== "string" ||
      typeof q.markSchemeSummary !== "string" ||
      typeof q.topicId !== "string"
    ) {
      return null;
    }
    out.push(item as ExamConditionsQuestion);
  }

  return out;
}

export async function POST(request: Request) {
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) {
    return jsonError("Payload too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.");
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid body.");
  }

  const payload = body as {
    questions?: unknown;
    answers?: unknown;
  };

  if (!Array.isArray(payload.questions) || !payload.answers || typeof payload.answers !== "object") {
    return jsonError("questions[] and answers object required.");
  }

  const questions = parseQuestions(payload.questions);
  if (!questions) {
    return jsonError("Invalid question payload.");
  }

  if (questions.length === 0) {
    return jsonError("No questions.");
  }

  if (questions.length > MAX_QUESTIONS) {
    return jsonError(`At most ${MAX_QUESTIONS} questions.`);
  }

  const answers = payload.answers as Record<string, string>;
  for (const key of Object.keys(answers)) {
    if (typeof answers[key] !== "string") {
      return jsonError("answers values must be strings.");
    }
    answers[key] = answers[key].slice(0, 12_000);
  }

  if (!isGeminiExamMarkingConfigured()) {
    return NextResponse.json({
      result: evaluateExamConditionsSession(questions, answers),
      provider: "local",
    });
  }

  try {
    const snapshot = getLocalSharedCurriculumSnapshot();
    const geminiRows = questions.map((q) => ({
      id: q.id,
      marks: q.marks,
      prompt: q.prompt,
      expectation: getCanonicalExpectation(q.id, q.expectation, snapshot),
      markSchemeSummary: buildServerMarkSchemeSummary(q.id, q.expectation, snapshot),
      commandWord: compactCommandWordForMarking(q.prompt),
      answer: answers[q.id] ?? "",
    }));

    const gemini = await generateExamSessionGeminiMarks(geminiRows);
    const result = mergeGeminiExamMarking(questions, answers, gemini);
    return NextResponse.json({ result, provider: "gemini" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marking failed.";
    return NextResponse.json(
      {
        result: evaluateExamConditionsSession(questions, answers),
        provider: "local",
        fallbackReason: message,
      },
      { status: 200 }
    );
  }
}
