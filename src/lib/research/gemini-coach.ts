import { buildTopicMaterialPack } from "@/lib/research/topic-material-pack";
import type { TopicIntelligenceIntent } from "@/lib/intelligence/types";
import {
  buildGeminiCacheKey,
  createGeminiTimeoutSignal,
  getGeminiModePolicy,
  readGeminiCachedResponse,
  writeGeminiCachedResponse,
} from "@/lib/research/gemini-policy";

const GEMINI_COACH_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_COACH_MODEL = process.env.GEMINI_COACH_MODEL?.trim() || "gemini-2.5-flash";

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

export interface GeminiCoachRequest {
  topicId: string;
  query: string;
  intent: TopicIntelligenceIntent;
  localDraftAnswer: string;
  localExamSafeFocus: string[];
  localMisconceptions: string[];
  draftAnswer?: string;
}

export interface GeminiCoachResponse {
  provider: "gemini-coach";
  model: string;
  answer: string;
  examSafeFocus: string[];
  misconceptions: string[];
  outOfScope: boolean;
}

export interface GeminiCoachStreamResult {
  provider: "gemini-coach";
  model: string;
  answer: string;
}

interface GeminiCoachPolicy {
  maxWords: number;
  answerInstruction: string;
  focusInstruction: string;
  misconceptionInstruction: string;
}

function cleanQuery(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function requireGeminiCoachConfig() {
  if (!GEMINI_COACH_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY. Gemini coach is unavailable.");
  }

  return {
    apiKey: GEMINI_COACH_API_KEY,
    model: GEMINI_COACH_MODEL,
  };
}

export function isGeminiCoachConfigured() {
  return Boolean(GEMINI_COACH_API_KEY);
}

export function getGeminiCoachModel() {
  return GEMINI_COACH_MODEL;
}

function trimWords(value: string, maxWords = 120) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function normaliseFocus(values: string[]) {
  return values.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 3);
}

function getCoachPolicy(intent: TopicIntelligenceIntent): GeminiCoachPolicy {
  switch (intent) {
    case "hint":
      return {
        maxWords: 90,
        answerInstruction:
          "Give scaffold only. No finished paragraph answer, no model sentences, no copyable response. Use structure, sequence, and coverage hints only.",
        focusInstruction:
          "Turn the 3 focus points into what to cover next, not a completed answer.",
        misconceptionInstruction:
          "Only warn about confusions that would block the learner from starting well.",
      };
    case "misconception-fix":
      return {
        maxWords: 110,
        answerInstruction:
          "Correct the confusion directly using short contrast language such as X is not Y because..., then state what the learner should say instead.",
        focusInstruction:
          "The 3 focus points must help the learner separate the terms or ideas cleanly.",
        misconceptionInstruction:
          "Prefer exact distinctions over broad advice.",
      };
    case "local-answer":
    default:
      return {
        maxWords: 120,
        answerInstruction:
          "Give a concise exam-safe explanation, but do not write a full essay answer. Keep it short enough to coach, not replace thinking.",
        focusInstruction:
          "The 3 focus points must be the most exam-useful things to mention.",
        misconceptionInstruction:
          "Include misconception warnings only if they are genuinely relevant.",
      };
  }
}

function buildCoachPrompt(
  request: GeminiCoachRequest,
  responseMode: "json" | "stream" = "json"
) {
  const { topic, materialPack } = buildTopicMaterialPack(request.topicId);
  const policy = getCoachPolicy(request.intent);

  return {
    topicLabel: topic.label,
    systemInstruction: [
      "You are an exam-safe coaching layer inside a T Level Digital Software Development revision website.",
      "You must stay strictly inside the supplied topic pack and the local router draft.",
      "Never drift to another topic, another qualification, or general tech advice.",
      "Never produce a full essay answer the learner could copy directly.",
      policy.answerInstruction,
      policy.focusInstruction,
      policy.misconceptionInstruction,
      `Keep the answer short, around ${policy.maxWords} words maximum.`,
      responseMode === "json"
        ? "Return JSON only and follow the schema exactly."
        : "Return plain text only. Do not use JSON, markdown headings, or labels. Stream only the direct response text.",
    ].join(" "),
    userPrompt: [
      `Topic: ${topic.label}`,
      `Intent: ${request.intent}`,
      `Policy word budget: ${policy.maxWords}`,
      `Learner query: ${request.query}`,
      request.draftAnswer ? `Learner draft answer: ${request.draftAnswer}` : null,
      `Local router draft answer: ${request.localDraftAnswer}`,
      `Local exam-safe focus: ${request.localExamSafeFocus.map((item) => `- ${item}`).join("\n")}`,
      request.localMisconceptions.length > 0
        ? `Local misconceptions: ${request.localMisconceptions.map((item) => `- ${item}`).join("\n")}`
        : null,
      "Use this topic pack as the hard boundary for your coaching response.",
      materialPack,
      "If the user query is outside this topic boundary, set outOfScope to true and explain that briefly.",
      responseMode === "json"
        ? "examSafeFocus must contain exactly 3 concise items."
        : "Write only the learner-facing direct response body.",
      responseMode === "json"
        ? "misconceptions must contain at most 2 concise items."
        : "Do not add preambles, bullets, headings, or JSON wrappers.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    policy,
  };
}

function extractGeminiResponseText(payload: GeminiGenerateContentResponse) {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

function getNovelChunk(existingText: string, incomingText: string) {
  if (!incomingText) {
    return "";
  }

  if (!existingText) {
    return incomingText;
  }

  if (incomingText === existingText) {
    return "";
  }

  if (incomingText.startsWith(existingText)) {
    return incomingText.slice(existingText.length);
  }

  const maxOverlap = Math.min(existingText.length, incomingText.length);
  for (let index = maxOverlap; index > 0; index -= 1) {
    const suffix = existingText.slice(-index);
    const prefix = incomingText.slice(0, index);
    if (suffix === prefix) {
      return incomingText.slice(index);
    }
  }

  if (existingText.endsWith(incomingText)) {
    return "";
  }

  return incomingText;
}

async function getGeminiErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as GeminiGenerateContentResponse;
      return payload.error?.message || "Gemini coach request failed.";
    }

    const text = (await response.text()).trim();
    return text || "Gemini coach request failed.";
  } catch {
    return "Gemini coach request failed.";
  }
}

async function handleGeminiSseBuffer(
  buffer: string,
  onChunk: (chunk: string) => Promise<void> | void,
  currentText: string
) {
  const blocks = buffer.split(/\r?\n\r?\n/);
  const remainder = blocks.pop() ?? "";
  let assembled = currentText;

  for (const block of blocks) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data: "))
      .map((line) => line.slice(6))
      .join("\n")
      .trim();

    if (!data || data === "[DONE]") {
      continue;
    }

    let payload: GeminiGenerateContentResponse;
    try {
      payload = JSON.parse(data) as GeminiGenerateContentResponse;
    } catch {
      continue;
    }

    if (payload.error?.message) {
      throw new Error(payload.error.message);
    }

    const text = extractGeminiResponseText(payload);
    if (!text) {
      continue;
    }

    const delta = getNovelChunk(assembled, text);
    if (!delta) {
      continue;
    }

    assembled += delta;
    await onChunk(delta);
  }

  return {
    assembled,
    remainder,
  };
}

export async function generateGeminiCoachResponse(
  request: GeminiCoachRequest
): Promise<GeminiCoachResponse> {
  const topicId = request.topicId.trim();
  const query = cleanQuery(request.query);

  if (!topicId) {
    throw new Error("Topic id is required for Gemini coach.");
  }

  if (query.length < 2) {
    throw new Error("Gemini coach query is too short.");
  }

  const { apiKey, model } = requireGeminiCoachConfig();
  const policyConfig = getGeminiModePolicy("coach");
  const cacheKey = buildGeminiCacheKey(
    "coach",
    topicId,
    request.intent,
    query,
    request.localDraftAnswer,
    request.draftAnswer ?? ""
  );
  const cached = readGeminiCachedResponse<GeminiCoachResponse>(cacheKey);
  if (cached) {
    return cached;
  }
  const { systemInstruction, userPrompt, policy } = buildCoachPrompt(
    {
      ...request,
      topicId,
      query,
    },
    "json"
  );

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
          temperature: 0.15,
          topP: 0.85,
          maxOutputTokens: policyConfig.maxOutputTokens,
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "object",
            properties: {
              answer: {
                type: "string",
                description:
                  `A concise exam-safe coaching response. No full essay answer. Keep to about ${policy.maxWords} words.`,
              },
              examSafeFocus: {
                type: "array",
                description: "Exactly 3 concise exam-safe points.",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "string",
                },
              },
              misconceptions: {
                type: "array",
                description: "Up to 2 concise misconception warnings.",
                minItems: 0,
                maxItems: 2,
                items: {
                  type: "string",
                },
              },
              outOfScope: {
                type: "boolean",
                description: "True only if the user query is outside the supplied topic boundary.",
              },
            },
            required: ["answer", "examSafeFocus", "misconceptions", "outOfScope"],
            additionalProperties: false,
          },
        },
      }),
      cache: "no-store",
      signal: createGeminiTimeoutSignal("coach"),
    }
  );

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini coach request failed.");
  }

  const responseText = extractGeminiResponseText(payload);

  if (!responseText) {
    throw new Error("Gemini coach did not return a response.");
  }

  const parsed = JSON.parse(responseText) as {
    answer?: string;
    examSafeFocus?: string[];
    misconceptions?: string[];
    outOfScope?: boolean;
  };

  const parsedResponse: GeminiCoachResponse = {
    provider: "gemini-coach",
    model,
    answer: trimWords(parsed.answer ?? request.localDraftAnswer),
    examSafeFocus: normaliseFocus(parsed.examSafeFocus ?? request.localExamSafeFocus),
    misconceptions: (parsed.misconceptions ?? request.localMisconceptions)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2),
    outOfScope: Boolean(parsed.outOfScope),
  };

  writeGeminiCachedResponse("coach", cacheKey, parsedResponse);
  return parsedResponse;
}

export async function streamGeminiCoachResponse(
  request: GeminiCoachRequest,
  onChunk: (chunk: string) => Promise<void> | void
): Promise<GeminiCoachStreamResult> {
  const topicId = request.topicId.trim();
  const query = cleanQuery(request.query);

  if (!topicId) {
    throw new Error("Topic id is required for Gemini coach.");
  }

  if (query.length < 2) {
    throw new Error("Gemini coach query is too short.");
  }

  const { apiKey, model } = requireGeminiCoachConfig();
  const policyConfig = getGeminiModePolicy("coach");
  const { systemInstruction, userPrompt, policy } = buildCoachPrompt(
    {
      ...request,
      topicId,
      query,
    },
    "stream"
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
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
          temperature: 0.15,
          topP: 0.85,
          maxOutputTokens: Math.min(400, policyConfig.maxOutputTokens),
        },
      }),
      cache: "no-store",
      signal: createGeminiTimeoutSignal("coach"),
    }
  );

  if (!response.ok) {
    throw new Error(await getGeminiErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("Gemini coach stream did not return a response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let assembled = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const result = await handleGeminiSseBuffer(buffer, onChunk, assembled);
    assembled = result.assembled;
    buffer = result.remainder;
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const result = await handleGeminiSseBuffer(buffer, onChunk, assembled);
    assembled = result.assembled;
  }

  const answer = trimWords(assembled.trim(), policy.maxWords);
  if (!answer) {
    throw new Error("Gemini coach stream returned no text.");
  }

  return {
    provider: "gemini-coach",
    model,
    answer,
  };
}
