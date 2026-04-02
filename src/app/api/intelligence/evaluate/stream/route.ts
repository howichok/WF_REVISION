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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function streamError(message: string, status = 400) {
  return new Response(toSseEvent("error", { message }), {
    status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

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
  const startedAt = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return streamError("Request body must be valid JSON.");
  }

  const validated = validateRequest(body);
  if ("error" in validated) {
    return streamError(validated.error, validated.status ?? 400);
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
