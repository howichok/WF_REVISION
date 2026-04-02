import { generateTopicIntelligenceResponse } from "@/lib/intelligence";
import {
  sleep,
  splitTextIntoChunks,
  toSseEvent,
  type IntelligenceStreamSectionPayload,
} from "@/lib/intelligence/streaming";
import type {
  TopicIntelligenceIntent,
  TopicIntelligenceRequest,
  TopicIntelligenceResponse,
} from "@/lib/intelligence/types";
import {
  getGeminiCoachModel,
  isGeminiCoachConfigured,
  streamGeminiCoachResponse,
} from "@/lib/research/gemini-coach";
import { recordRevisionRouteMetric } from "@/lib/revision-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function getStatusMessage(response: TopicIntelligenceResponse) {
  if (response.provider === "gemini-grounded") {
    return "Streaming grounded answer...";
  }

  if (response.provider === "gemini-coach") {
    return "Streaming Gemini coach response...";
  }

  return "Streaming exam-safe response...";
}

function isGeminiCoachStreamEligible(response: TopicIntelligenceResponse) {
  if (!isGeminiCoachConfigured()) {
    return false;
  }

  if (response.confidence === "low") {
    return false;
  }

  return (
    response.provider === "local-rule-engine" &&
    response.localOnly &&
    (
      response.intent === "hint" ||
      response.intent === "local-answer" ||
      response.intent === "misconception-fix"
    )
  );
}

function buildStreamMeta(
  response: TopicIntelligenceResponse,
  useGeminiCoachStream: boolean
): TopicIntelligenceResponse {
  return {
    ...response,
    provider: useGeminiCoachStream ? "gemini-coach" : response.provider,
    model: useGeminiCoachStream ? getGeminiCoachModel() : response.model,
    answer: "",
    examSafeFocus: [],
    misconceptions: [],
    suggestedNextAction: null,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to stream the topic assistant response right now.";
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

function buildPrecisionCueItems(response: TopicIntelligenceResponse) {
  const keywordMatches = response.examSafeFocus.filter((item) =>
    /(replace|precision|precise|vague|use |name |state |clarify|distinguish|define|specific|trade-off|instead)/i.test(
      item
    )
  );

  return uniqueItems(
    keywordMatches.length > 0 ? keywordMatches : response.examSafeFocus.slice(0, 2),
    2
  );
}

function buildSectionEvents(response: TopicIntelligenceResponse): IntelligenceStreamSectionPayload[] {
  const events: IntelligenceStreamSectionPayload[] = [];
  const precisionCues = buildPrecisionCueItems(response);

  if (precisionCues.length > 0) {
    events.push({
      section: "precisionCues",
      items: precisionCues,
    });
  }

  if (response.examSafeFocus.length > 0) {
    events.push({
      section: "examSafeFocus",
      items: response.examSafeFocus,
    });
  }

  if (response.misconceptions.length > 0) {
    events.push({
      section: "misconceptions",
      items: response.misconceptions,
    });
  }

  if (response.suggestedNextAction) {
    events.push({
      section: "next-step",
      action: response.suggestedNextAction,
    });
  }

  return events;
}

function sendSectionGroup(
  sections: IntelligenceStreamSectionPayload[],
  phase: "early" | "late"
) {
  return sections
    .filter((section) =>
      phase === "early"
        ? section.section === "precisionCues" || section.section === "misconceptions"
        : section.section === "examSafeFocus" || section.section === "next-step"
    );
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(
      toSseEvent("error", { message: "Request body must be valid JSON." }),
      {
        status: 400,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      }
    );
  }

  const validated = validateRequest(body);
  if ("error" in validated) {
    return new Response(toSseEvent("error", { message: validated.error }), {
      status: validated.status ?? 400,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Parameters<typeof toSseEvent>[0], data: unknown) => {
        controller.enqueue(encoder.encode(toSseEvent(event, data)));
      };

      send("status", {
        stage: "routing",
        message: "Routing your DSD request...",
      });

      try {
        const response = await generateTopicIntelligenceResponse(validated, {
          coachResolver: async () => {
            throw new Error("Gemini coach streaming is handled separately.");
          },
        });
        const useGeminiCoachStream = isGeminiCoachStreamEligible(response);
        const sectionEvents = buildSectionEvents(response);

        send("meta", buildStreamMeta(response, useGeminiCoachStream));
        for (const section of sendSectionGroup(sectionEvents, "early")) {
          send("section", section);
          await sleep(10);
        }

        if (useGeminiCoachStream) {
          let receivedCoachChunk = false;

          try {
            send("status", {
              stage: "coach-connect",
              message: "Connecting Gemini coach stream...",
            });

            const streamed = await streamGeminiCoachResponse(
              {
                topicId: validated.topicId,
                query: response.query,
                intent: response.intent,
                localDraftAnswer: response.answer,
                localExamSafeFocus: response.examSafeFocus,
                localMisconceptions: response.misconceptions,
                draftAnswer: validated.draftAnswer,
              },
              async (text) => {
                if (!receivedCoachChunk) {
                  send("status", {
                    stage: "coach-stream",
                    message: "Gemini coach is answering live...",
                  });
                  receivedCoachChunk = true;
                }

                send("chunk", { text });
              }
            );

            const finalResponse = {
              ...response,
              provider: streamed.provider,
              model: streamed.model,
              answer: streamed.answer,
            };
            const finalSectionEvents = buildSectionEvents(finalResponse);

            for (const section of sendSectionGroup(finalSectionEvents, "late")) {
              send("section", section);
              await sleep(12);
            }

            send("final", {
              ...finalResponse,
            });
            recordRevisionRouteMetric("topic-assistant-stream", Date.now() - startedAt, true);

            return;
          } catch {
            send("status", {
              stage: "coach-fallback",
              message: receivedCoachChunk
                ? "Gemini stream dropped, restoring the safe local answer..."
                : "Gemini stream unavailable, falling back to the safe local answer...",
            });

            if (receivedCoachChunk) {
              for (const section of sendSectionGroup(sectionEvents, "late")) {
                send("section", section);
                await sleep(12);
              }
              send("final", response);
              recordRevisionRouteMetric("topic-assistant-stream", Date.now() - startedAt, true);
              return;
            }
          }
        }

        send("status", {
          stage: "typing",
          message: getStatusMessage(response),
        });

        for (const chunk of splitTextIntoChunks(response.answer)) {
          send("chunk", { text: chunk });
          await sleep(18);
        }

        for (const section of sendSectionGroup(sectionEvents, "late")) {
          send("section", section);
          await sleep(12);
        }

        send("final", response);
        recordRevisionRouteMetric("topic-assistant-stream", Date.now() - startedAt, true);
      } catch (error) {
        send("error", {
          message: getErrorMessage(error),
        });
        recordRevisionRouteMetric("topic-assistant-stream", Date.now() - startedAt, false);
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
