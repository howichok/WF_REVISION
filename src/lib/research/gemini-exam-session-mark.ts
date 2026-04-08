import { createGeminiTimeoutSignal, getGeminiModePolicy } from "@/lib/research/gemini-policy";
import type { GeminiExamMarkResponse } from "@/lib/exam-conditions";

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

export function isGeminiExamMarkingConfigured() {
  return Boolean(GEMINI_API_KEY);
}

function extractResponseText(payload: GeminiGenerateContentResponse) {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
}

function compactRow(input: {
  id: string;
  marks: number;
  prompt: string;
  expectation: string;
  markSchemeSummary: string;
  answer: string;
}) {
  const answerCap = input.answer.length > 2800 ? 2200 : 1200;
  return {
    i: input.id,
    x: input.marks,
    s: input.markSchemeSummary.replace(/\s+/g, " ").trim().slice(0, 280),
    e: input.expectation.replace(/\s+/g, " ").trim().slice(0, 180),
    q: input.prompt.replace(/\s+/g, " ").trim().slice(0, 240),
    a: input.answer.replace(/\s+/g, " ").trim().slice(0, answerCap),
  };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    band: { type: "string" },
    oneLiner: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          m: { type: "number" },
          hit: { type: "array", items: { type: "string" } },
          miss: { type: "array", items: { type: "string" } },
          fb: { type: "string" },
        },
        required: ["id", "m", "hit", "miss", "fb"],
        additionalProperties: false,
      },
    },
  },
  required: ["band", "oneLiner", "items"],
  additionalProperties: false,
};

const SYSTEM_TEXT =
  "You mark a whole exam session in one reply. Use field s (mark scheme) and e (expectation). " +
  "For each item: m = marks 0..x (number only). hit = up to 4 short evidence phrases earned; miss = up to 4 gaps. " +
  "fb = one tight feedback line (max 32 words). band = exactly one of: Below, Pass, Merit, Strong. " +
  "oneLiner = max 22 words overall. Be strict but fair; partial credit allowed. Output JSON only.";

function parseMarkResponse(text: string): GeminiExamMarkResponse {
  const parsed = JSON.parse(text) as {
    band?: string;
    oneLiner?: string;
    items?: Array<{
      id?: string;
      m?: number;
      hit?: string[];
      miss?: string[];
      fb?: string;
    }>;
  };

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error("Invalid mark response: missing items.");
  }

  return {
    band: String(parsed.band ?? "Pass").slice(0, 48),
    oneLiner: String(parsed.oneLiner ?? "").slice(0, 400),
    items: parsed.items.map((row) => ({
      id: String(row.id ?? ""),
      m: typeof row.m === "number" ? row.m : Number(row.m) || 0,
      hit: Array.isArray(row.hit) ? row.hit.map((h) => String(h).slice(0, 120)) : [],
      miss: Array.isArray(row.miss) ? row.miss.map((h) => String(h).slice(0, 120)) : [],
      fb: String(row.fb ?? "").slice(0, 400),
    })),
  };
}

export async function generateExamSessionGeminiMarks(
  rows: Array<{
    id: string;
    marks: number;
    prompt: string;
    expectation: string;
    markSchemeSummary: string;
    answer: string;
  }>
): Promise<GeminiExamMarkResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  if (rows.length === 0) {
    throw new Error("No items to mark.");
  }

  if (rows.length > 22) {
    throw new Error("Too many questions for one marking request.");
  }

  const policy = getGeminiModePolicy("exam-session-mark");
  const compact = rows.map(compactRow);
  const userPayload = JSON.stringify({ topic: "DSD", n: compact.length, items: compact });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_TEXT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPayload }],
          },
        ],
        generationConfig: {
          temperature: 0.12,
          topP: 0.85,
          maxOutputTokens: policy.maxOutputTokens,
          responseMimeType: "application/json",
          responseJsonSchema: RESPONSE_SCHEMA,
        },
      }),
      cache: "no-store",
      signal: createGeminiTimeoutSignal("exam-session-mark"),
    }
  );

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || "Gemini exam marking failed.");
  }

  const responseText = extractResponseText(payload);
  if (!responseText) {
    throw new Error("Gemini returned empty marking response.");
  }

  return parseMarkResponse(responseText);
}
