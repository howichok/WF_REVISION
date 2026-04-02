import { generateRevisionImprovementResponse } from "@/lib/intelligence";
import { getPredictionFromRevisionImprove } from "@/lib/intelligence/revision-prediction";
import { recordRevisionRouteMetric } from "@/lib/revision-runtime";
import {
  sleep,
  splitTextIntoChunks,
  toSseEvent,
  type IntelligenceStreamSectionPayload,
  type RevisionImproveStreamMeta,
} from "@/lib/intelligence/streaming";
import type {
  RevisionImprovementRequest,
  RevisionImprovementResponse,
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

function shortenInline(value: string, maxLength = 42) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function uniqueItems(items: Array<string | null | undefined>, limit = 3) {
  return Array.from(
    new Set(
      items
        .map((item) => item?.replace(/\s+/g, " ").trim())
        .filter((item): item is string => Boolean(item))
    )
  ).slice(0, limit);
}

function buildImproveSectionEvents(
  improvement: RevisionImprovementResponse
): IntelligenceStreamSectionPayload[] {
  const precisionCues = uniqueItems(
    [
      ...improvement.changes.flatMap((change) => {
        if (change.kind === "replace" && change.targetText && change.microRewriteText) {
          return [`Swap "${shortenInline(change.targetText, 26)}" for "${change.microRewriteText}".`];
        }

        if (change.kind === "replace" && change.targetText) {
          return [
            `Tighten "${shortenInline(change.targetText, 26)}": ${shortenInline(change.replacementText, 68)}`,
          ];
        }

        if (change.kind === "add") {
          return [`Add this missing point: ${shortenInline(change.replacementText, 68)}`];
        }

        return [];
      }),
      ...improvement.weakSpans.map((span) => span.replacementHint),
    ],
    3
  );

  const misconceptionCues = uniqueItems(
    [
      ...improvement.weakSpans
        .filter((span) => span.severity === "high")
        .map((span) => `Avoid this confusion: ${shortenInline(span.reason, 96)}`),
      ...improvement.commentator
        .filter((item) => /^Fix this confusion:/i.test(item))
        .map((item) => item.replace(/^Fix this confusion:\s*/i, "Avoid this confusion: ")),
    ],
    2
  );

  const events: IntelligenceStreamSectionPayload[] = [];

  if (precisionCues.length > 0) {
    events.push({
      section: "precisionCues",
      items: precisionCues,
    });
  }

  if (misconceptionCues.length > 0) {
    events.push({
      section: "misconceptions",
      items: misconceptionCues,
    });
  }

  return events;
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
        stage: "improve-start",
        message: "Scanning for weak phrases and upgrade spots...",
      });

      try {
        const improvement = await generateRevisionImprovementResponse(validated);
        const prediction = getPredictionFromRevisionImprove(improvement);
        const meta: RevisionImproveStreamMeta = {
          mode: "revision-improve",
          questionId: improvement.questionId,
          topicId: improvement.topicId,
          outputMode: improvement.outputMode,
          provider: improvement.provider,
          model: improvement.model,
        };

        send("meta", meta);
        send("prediction", {
          source: "revision-improve",
          ...prediction,
        });
        for (const section of buildImproveSectionEvents(improvement)) {
          send("section", section);
          await sleep(10);
        }
        send("status", {
          stage: "improve-type",
          message: "Streaming targeted upgrade guidance...",
        });

        const liveText = [
          improvement.summary,
          ...improvement.commentator.slice(0, 3),
        ].join(" ");

        for (const chunk of splitTextIntoChunks(liveText)) {
          send("chunk", { text: chunk });
          await sleep(18);
        }

        send("final", improvement);
        recordRevisionRouteMetric("revision-improve-stream", Date.now() - startedAt, true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to improve the submitted answer.";
        send("error", { message });
        recordRevisionRouteMetric("revision-improve-stream", Date.now() - startedAt, false);
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
