import { evaluateRevisionAnswer } from "@/lib/intelligence";
import {
  getPredictionFromRevisionEvaluation,
} from "@/lib/intelligence/revision-prediction";
import { recordRevisionRouteMetric } from "@/lib/revision-runtime";
import {
  sleep,
  splitTextIntoChunks,
  toSseEvent,
  type RevisionEvaluationStreamMeta,
} from "@/lib/intelligence/streaming";
import type {
  RevisionAnswerEvaluation,
  RevisionEvaluationRequest,
} from "@/lib/intelligence/types";
import {
  applyRateLimit,
  bodyTooLarge,
  getApiUser,
  sseError,
  sseRateLimitResponse,
} from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64_000;

function validateRequest(
  value: unknown
): RevisionEvaluationRequest | { error: string; status?: number } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid intelligence evaluation payload." };
  }

  const payload = value as Partial<RevisionEvaluationRequest>;
  if (payload.mode !== "revision-answer") {
    return { error: "Unsupported evaluation mode." };
  }

  if (typeof payload.questionId !== "string" || !payload.questionId.trim()) {
    return { error: "Question id is required." };
  }

  if (typeof payload.answer !== "string" || payload.answer.trim().length < 8) {
    return { error: "Answer is too short to evaluate reliably." };
  }

  return {
    mode: "revision-answer",
    questionId: payload.questionId.trim(),
    answer: payload.answer.trim().slice(0, 4000),
  };
}

export async function POST(request: Request) {
  const rl = applyRateLimit(request, "evaluate-stream", 20);
  if (!rl.ok) {
    return sseRateLimitResponse(rl.retryAfterSec);
  }

  const user = await getApiUser(request);
  if (!user) {
    const hasConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (hasConfig) {
      return sseError("Authentication required.", 401);
    }
  }

  if (bodyTooLarge(request, MAX_BODY_BYTES)) {
    return sseError("Payload too large.", 413);
  }

  const startedAt = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return sseError("Request body must be valid JSON.");
  }

  const validated = validateRequest(body);
  if ("error" in validated) {
    return sseError(validated.error, validated.status ?? 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Parameters<typeof toSseEvent>[0], data: unknown) => {
        controller.enqueue(encoder.encode(toSseEvent(event, data)));
      };

      send("status", {
        stage: "evaluate-start",
        message: "Locking onto the written response...",
      });

      try {
        const evaluation = evaluateRevisionAnswer(validated) as RevisionAnswerEvaluation;
        const prediction = getPredictionFromRevisionEvaluation(evaluation);
        const meta: RevisionEvaluationStreamMeta = {
          mode: "revision-answer",
          questionId: evaluation.questionId,
          topicId: evaluation.topicId,
        };

        send("meta", meta);
        send("prediction", {
          source: "revision-evaluate",
          ...prediction,
        });
        send("status", {
          stage: "evaluate-type",
          message: "Streaming mark-scheme feedback...",
        });

        const liveText = [
          `Score ${evaluation.score}/${evaluation.maxScore}.`,
          evaluation.feedback,
        ].join(" ");

        for (const chunk of splitTextIntoChunks(liveText)) {
          send("chunk", { text: chunk });
          await sleep(18);
        }

        send("final", evaluation);
        recordRevisionRouteMetric("revision-evaluate-stream", Date.now() - startedAt, true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to evaluate the submitted content.";
        send("error", { message });
        recordRevisionRouteMetric("revision-evaluate-stream", Date.now() - startedAt, false);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
