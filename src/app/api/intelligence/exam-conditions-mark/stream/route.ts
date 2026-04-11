import {
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
  isGeminiExamMarkingConfigured,
  streamExamSessionGeminiMarks,
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
    return new Response(
      JSON.stringify({
        type: "error",
        error: "Too many marking requests. Try again in a moment.",
        retryAfterSec: rl.retryAfterSec,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSec),
        },
      }
    );
  }

  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ type: "error", error: "Payload too large." }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ type: "error", error: "Invalid JSON." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ type: "error", error: "Invalid body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = body as {
    questions?: unknown;
    answers?: unknown;
    topicLabel?: unknown;
  };

  if (!Array.isArray(payload.questions) || !payload.answers || typeof payload.answers !== "object") {
    return new Response(JSON.stringify({ type: "error", error: "questions[] and answers object required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const questions = parseQuestions(payload.questions);
  if (!questions) {
    return new Response(JSON.stringify({ type: "error", error: "Invalid question payload." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (questions.length === 0) {
    return new Response(JSON.stringify({ type: "error", error: "No questions." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (questions.length > MAX_QUESTIONS) {
    return new Response(JSON.stringify({ type: "error", error: `At most ${MAX_QUESTIONS} questions.` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (questions.length < EXAM_CONDITIONS_SESSION_MIN_QUESTIONS) {
    return new Response(
      JSON.stringify({
        type: "error",
        error: `At least ${EXAM_CONDITIONS_SESSION_MIN_QUESTIONS} questions required for marking.`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const answers = payload.answers as Record<string, string>;
  for (const key of Object.keys(answers)) {
    if (typeof answers[key] !== "string") {
      return new Response(JSON.stringify({ type: "error", error: "answers values must be strings." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
    const result = {
      ...evaluateExamConditionsSession(questions, answers),
      examMarkingMeta: { usedGemini: false, aiSkippedNote },
    };
    const encoder = new TextEncoder();
    const localStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`${JSON.stringify({ type: "complete", result, provider: "local" })}\n`)
        );
        controller.close();
      },
    });
    return new Response(localStream, {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const topicLabel =
    typeof payload.topicLabel === "string" ? payload.topicLabel.replace(/\s+/g, " ").trim().slice(0, 160) : "";

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const push = (obj: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      };

      const started = Date.now();
      try {
        const geminiOutcome = await streamExamSessionGeminiMarks(geminiRows, {
          subjectLabel: topicLabel,
          onDelta: async (chunk) => {
            if (chunk) {
              push({ type: "delta", text: chunk });
            }
          },
        });
        const result = mergeGeminiExamMarking(questions, answers, geminiOutcome.response);
        const durationMs = Date.now() - started;
        if (shouldLogExamMarkMetrics()) {
          console.info(
            JSON.stringify({
              tag: "exam-conditions-mark-stream",
              durationMs,
              questionCount: questions.length,
              provider: "gemini",
              recovered: geminiOutcome.recovered,
            })
          );
        }
        push({
          type: "complete",
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
              tag: "exam-conditions-mark-stream",
              questionCount: questions.length,
              provider: "local",
              error: message.slice(0, 240),
            })
          );
        }
        push({
          type: "complete",
          result: {
            ...fallback,
            examMarkingMeta: {
              usedGemini: false,
              aiSkippedNote: friendlyMarkingFailureMessage(message),
            },
          },
          provider: "local",
          fallbackReason: message,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
