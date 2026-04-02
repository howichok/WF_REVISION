import { buildTopicMaterialPack } from "@/lib/research/topic-material-pack";
import {
  buildGeminiCacheKey,
  createGeminiTimeoutSignal,
  getGeminiModePolicy,
  readGeminiCachedResponse,
  writeGeminiCachedResponse,
} from "@/lib/research/gemini-policy";
import type {
  RevisionImprovementChange,
  RevisionImprovementResponse,
} from "@/lib/intelligence/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = process.env.GEMINI_COACH_MODEL?.trim() || "gemini-2.5-flash";

interface GeminiContentPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiContentPart[];
  };
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
}

export interface GeminiRevisionPolishRequest {
  topicId: string;
  questionPrompt: string;
  learnerAnswer: string;
  localImprovement: RevisionImprovementResponse;
}

export interface GeminiRevisionPolishResponse {
  provider: "gemini-coach";
  model: string;
  summary: string;
  commentator: string[];
  checklist: string[];
  changes: Array<
    Pick<RevisionImprovementChange, "id" | "replacementText" | "rationale" | "microRewriteText">
  >;
  outOfScope: boolean;
}

function requireGeminiConfig() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Gemini revision polish is unavailable.");
  }

  return {
    apiKey: GEMINI_API_KEY,
    model: GEMINI_MODEL,
  };
}

function trimWords(value: string, maxWords = 24) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function normaliseList(values: string[], maxItems: number, maxWords: number) {
  return values
    .map((value) => trimWords(value.replace(/\s+/g, " ").trim(), maxWords))
    .filter(Boolean)
    .slice(0, maxItems);
}

function extractResponseText(payload: GeminiGenerateContentResponse) {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

function buildPrompt(request: GeminiRevisionPolishRequest) {
  const { topic, materialPack } = buildTopicMaterialPack(request.topicId);

  return {
    systemInstruction: [
      "You polish short exam-coaching guidance inside a T Level Digital Software Development revision website.",
      "You are not allowed to rewrite the learner's full answer.",
      "You must keep the deterministic weak spans, counts, and ids unchanged; you may only tighten the wording of summary, checklist items, commentator bullets, and diff hints.",
      "Do not repeat the learner answer back.",
      "Do not output paragraphs that could replace the learner's own response.",
      "Stay strictly inside the supplied topic pack and question.",
      "Return JSON only and follow the schema exactly.",
    ].join(" "),
    userPrompt: [
      `Topic: ${topic.label}`,
      `Question: ${request.questionPrompt}`,
      `Output mode: ${request.localImprovement.outputMode}`,
      `Learner answer: ${request.learnerAnswer}`,
      `Local summary: ${request.localImprovement.summary}`,
      `Local commentator:\n${request.localImprovement.commentator.map((item) => `- ${item}`).join("\n")}`,
      `Local checklist:\n${request.localImprovement.checklist.map((item) => `- ${item}`).join("\n")}`,
      `Deterministic weak spans:\n${request.localImprovement.weakSpans
        .map((span) => `- ${span.label}: ${span.reason}${span.replacementHint ? ` (${span.replacementHint})` : ""}`)
        .join("\n")}`,
      `Local change hints:\n${request.localImprovement.changes
        .map((change) => `- ${change.id}: ${change.label}. ${change.replacementText}. ${change.rationale}`)
        .join("\n")}`,
      "The ids in changes must stay exactly the same.",
      "Commentator must stay concise and exam-safe.",
      "Checklist must stay short and actionable.",
      "Replacement text must stay as a hint, not a finished answer sentence.",
      "microRewriteText is optional and only allowed for very short phrase-level rewrites of 1 to 5 words.",
      "Do not provide microRewriteText for full clauses, full sentences, or anything copy-paste essay-like.",
      "If the request is outside the topic boundary, set outOfScope to true.",
      materialPack,
    ].join("\n\n"),
  };
}

export async function generateGeminiRevisionPolish(
  request: GeminiRevisionPolishRequest
): Promise<GeminiRevisionPolishResponse> {
  const topicId = request.topicId.trim();
  if (!topicId) {
    throw new Error("Topic id is required for Gemini revision polish.");
  }

  const { apiKey, model } = requireGeminiConfig();
  const policyConfig = getGeminiModePolicy("improve-polish");
  const cacheKey = buildGeminiCacheKey(
    "improve-polish",
    topicId,
    request.questionPrompt,
    request.learnerAnswer,
    request.localImprovement.outputMode
  );
  const cached = readGeminiCachedResponse<GeminiRevisionPolishResponse>(cacheKey);
  if (cached) {
    return cached;
  }
  const { systemInstruction, userPrompt } = buildPrompt({
    ...request,
    topicId,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.85,
          maxOutputTokens: policyConfig.maxOutputTokens,
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
              },
              commentator: {
                type: "array",
                minItems: 0,
                maxItems: 3,
                items: { type: "string" },
              },
              checklist: {
                type: "array",
                minItems: 0,
                maxItems: 4,
                items: { type: "string" },
              },
              changes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    replacementText: { type: "string" },
                    rationale: { type: "string" },
                    microRewriteText: { type: "string" },
                  },
                  required: ["id", "replacementText", "rationale"],
                  additionalProperties: false,
                },
              },
              outOfScope: {
                type: "boolean",
              },
            },
            required: ["summary", "commentator", "checklist", "changes", "outOfScope"],
            additionalProperties: false,
          },
        },
      }),
      cache: "no-store",
      signal: createGeminiTimeoutSignal("improve-polish"),
    }
  );

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini revision polish request failed.");
  }

  const responseText = extractResponseText(payload);
  if (!responseText) {
    throw new Error("Gemini revision polish returned no response.");
  }

  const parsed = JSON.parse(responseText) as {
    summary?: string;
    commentator?: string[];
    checklist?: string[];
    changes?: Array<{
      id?: string;
      replacementText?: string;
      rationale?: string;
      microRewriteText?: string;
    }>;
    outOfScope?: boolean;
  };

  const parsedResponse: GeminiRevisionPolishResponse = {
    provider: "gemini-coach",
    model,
    summary: trimWords(parsed.summary ?? request.localImprovement.summary, 28),
    commentator: normaliseList(
      parsed.commentator ?? request.localImprovement.commentator,
      3,
      18
    ),
    checklist: normaliseList(
      parsed.checklist ?? request.localImprovement.checklist,
      4,
      14
    ),
    changes: (parsed.changes ?? [])
      .map((change) => ({
        id: change.id ?? "",
        replacementText: trimWords(change.replacementText ?? "", 18),
        rationale: trimWords(change.rationale ?? "", 18),
        microRewriteText: trimWords(change.microRewriteText ?? "", 5),
      }))
      .filter((change) => change.id && change.replacementText && change.rationale),
    outOfScope: Boolean(parsed.outOfScope),
  };

  writeGeminiCachedResponse("improve-polish", cacheKey, parsedResponse);
  return parsedResponse;
}
