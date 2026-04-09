import { NextResponse } from "next/server";
import {
  buildLocalSessionClosingFeedback,
  evaluateExamConditionsSession,
  EXAM_CONDITIONS_SESSION_MAX_QUESTIONS,
  EXAM_CONDITIONS_SESSION_MIN_QUESTIONS,
  mergeGeminiExamMarking,
  type ExamConditionsQuestion,
} from "@/lib/exam-conditions";
import { checkExamMarkRateLimit } from "@/lib/exam-mark-rate-limit";
import { parseGeminiExamMarkPolicy } from "@/lib/exam-marking-ai-gate";
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

function shouldLogExamMarkMetrics() {
  return process.env.NODE_ENV === "development" || process.env.EXAM_MARK_ANALYTICS === "1";
}

function friendlyMarkingFailureMessage(raw: string): string {
  if (raw.includes("could not read") || raw.includes("Your answers are safe")) {
    return `${raw} Showing fast local scores instead.`;
  }
  if (/timeout|aborted|AbortError/i.test(raw)) {
    return "Marking timed out — try again in a moment. Showing fast local scores for now.";
  }
  return `We couldn't finish AI marking. Showing fast local scores instead. (${raw})`;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function rateLimitKey(request: Request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]!.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
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
  const rl = checkExamMarkRateLimit(`exam-mark:${rateLimitKey(request)}`, 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many marking requests. Try again in a moment.", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

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
    /** Optional display label (e.g. topic name) — steers examiner tone in the model prompt. */
    topicLabel?: unknown;
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

  if (questions.length < EXAM_CONDITIONS_SESSION_MIN_QUESTIONS) {
    return jsonError(`At least ${EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} questions required for marking.`);
  }

  const answers = payload.answers as Record<string, string>;
  for (const key of Object.keys(answers)) {
    if (typeof answers[key] !== "string") {
      return jsonError("answers values must be strings.");
    }
    answers[key] = answers[key].slice(0, 12_000);
  }

  const policy = parseGeminiExamMarkPolicy();
  const keyOk = isGeminiExamMarkingConfigured();
  const useAi = policy === "ai" && keyOk;

  if (!useAi) {
    const aiSkippedNote = !keyOk
      ? "No Gemini API key — showing local scores only. Add GEMINI_API_KEY for AI marking."
      : "GEMINI_EXAM_MARK_POLICY is local/off — AI marking disabled.";

    return NextResponse.json({
      result: {
        ...evaluateExamConditionsSession(questions, answers),
        examMarkingMeta: { usedGemini: false, aiSkippedNote },
      },
      provider: "local",
    });
  }

  const topicLabel =
    typeof payload.topicLabel === "string" ? payload.topicLabel.replace(/\s+/g, " ").trim().slice(0, 160) : "";

  try {
    const snapshot = getLocalSharedCurriculumSnapshot();
    const started = Date.now();

    const geminiRows = questions.map((q) => ({
      id: q.id,
      marks: q.marks,
      prompt: q.prompt,
      expectation: getCanonicalExpectation(q.id, q.expectation, snapshot),
      markSchemeSummary: buildServerMarkSchemeSummary(q.id, q.expectation, snapshot),
      commandWord: compactCommandWordForMarking(q.prompt),
      answer: answers[q.id] ?? "",
    }));

    const geminiOutcome = await generateExamSessionGeminiMarks(geminiRows, { subjectLabel: topicLabel });
    const result = mergeGeminiExamMarking(questions, answers, geminiOutcome.response);

    const durationMs = Date.now() - started;
    if (shouldLogExamMarkMetrics()) {
      console.info(
        JSON.stringify({
          tag: "exam-conditions-mark",
          durationMs,
          questionCount: questions.length,
          provider: "gemini",
          recovered: geminiOutcome.recovered,
        })
      );
    }

    return NextResponse.json({
      result: {
        ...result,
        examMarkingMeta: {
          usedGemini: true,
          geminiQuestionCount: questions.length,
          localQuestionCount: 0,
          ...(geminiOutcome.recovered ? { markingResponseRecovered: true } : {}),
        },
        markingProvider: "gemini",
      },
      provider: "gemini",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marking failed.";
    const fallback = evaluateExamConditionsSession(questions, answers);
    if (shouldLogExamMarkMetrics()) {
      console.info(
        JSON.stringify({
          tag: "exam-conditions-mark",
          questionCount: questions.length,
          provider: "local",
          error: message.slice(0, 240),
        })
      );
    }
    return NextResponse.json(
      {
        result: {
          ...fallback,
          examMarkingMeta: {
            usedGemini: false,
            aiSkippedNote: friendlyMarkingFailureMessage(message),
          },
        },
        provider: "local",
        fallbackReason: message,
      },
      { status: 200 }
    );
  }
}
