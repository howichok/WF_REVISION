import type { GeminiExamMarkResponse } from "@/lib/exam-conditions";
import { parseItemLevel } from "@/lib/exam-conditions-marking-post";
import { createGeminiTimeoutSignal, getGeminiModePolicy } from "@/lib/research/gemini-policy";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL =
  process.env.GEMINI_EXAM_MARK_MODEL?.trim() ||
  process.env.GEMINI_COACH_MODEL?.trim() ||
  "gemini-2.5-flash";

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
  commandWord?: string;
  answer: string;
}) {
  const answerCap = input.answer.length > 2800 ? 2200 : 1200;
  return {
    i: input.id,
    x: input.marks,
    s: input.markSchemeSummary.replace(/\s+/g, " ").trim().slice(0, 780),
    e: input.expectation.replace(/\s+/g, " ").trim().slice(0, 420),
    q: input.prompt.replace(/\s+/g, " ").trim().slice(0, 280),
    cw: (input.commandWord ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
    a: input.answer.replace(/\s+/g, " ").trim().slice(0, answerCap),
  };
}

const ITEM_LEVEL_SCHEMA = {
  type: "string",
  enum: ["none", "basic", "clear", "detailed"],
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    band: { type: "string" },
    oneLiner: { type: "string" },
    examinerNote: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          m: { type: "number" },
          why: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          hit: { type: "array", items: { type: "string" } },
          miss: { type: "array", items: { type: "string" } },
          fb: { type: "string" },
          level: ITEM_LEVEL_SCHEMA,
        },
        required: ["id", "m", "why", "evidence", "hit", "miss", "fb", "level"],
        additionalProperties: false,
      },
    },
  },
  required: ["band", "oneLiner", "examinerNote", "items"],
  additionalProperties: false,
};

const SYSTEM_TEXT =
  "You are an examiner marking a whole Digital Services Design session in one JSON reply. " +
  "Credit ONLY ideas clearly present in field a (the student's answer). Do not invent facts they did not write. " +
  "Use s (mark scheme), e (expectation), q (question), and cw (command word hint: id:guidance) to judge what was asked. " +
  "Walk the scheme points in s; hit/miss must name specific scheme expectations, not vague praise. " +
  "Marks m must be whole numbers from 0 to x inclusive (half marks are not used). " +
  "If the answer is vague or off-topic, award the lower end of the range. " +
  "why = one or two short sentences: why this mark (what was credited or missing). " +
  "evidence = up to 3 short quotes or tight paraphrases from a that support hit (empty if none). " +
  "level = none|basic|clear|detailed matching depth vs x. " +
  "fb = one feedback line for the student (max 36 words). " +
  "band = exactly one of: Below, Pass, Merit, Strong — consistent with total marks across items. " +
  "oneLiner = max 24 words summarising the whole session. " +
  "examinerNote = one honest line that AI marking is approximate and not a replacement for a real examiner. " +
  "Output JSON only; every question id in the payload must appear exactly once in items.";

function parseMarkResponse(text: string): GeminiExamMarkResponse {
  const parsed = JSON.parse(text) as {
    band?: string;
    oneLiner?: string;
    examinerNote?: string;
    items?: Array<{
      id?: string;
      m?: number;
      why?: string;
      evidence?: string[];
      hit?: string[];
      miss?: string[];
      fb?: string;
      level?: string;
    }>;
  };

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error("Invalid mark response: missing items.");
  }

  return {
    band: String(parsed.band ?? "Pass").slice(0, 48),
    oneLiner: String(parsed.oneLiner ?? "").slice(0, 400),
    examinerNote: String(parsed.examinerNote ?? "").replace(/\s+/g, " ").trim().slice(0, 280),
    items: parsed.items.map((row) => ({
      id: String(row.id ?? ""),
      m: typeof row.m === "number" ? row.m : Number(row.m) || 0,
      why: String(row.why ?? "").replace(/\s+/g, " ").trim().slice(0, 520),
      evidence: Array.isArray(row.evidence)
        ? row.evidence.map((line) => String(line).replace(/\s+/g, " ").trim().slice(0, 200)).slice(0, 3)
        : [],
      hit: Array.isArray(row.hit) ? row.hit.map((h) => String(h).slice(0, 120)) : [],
      miss: Array.isArray(row.miss) ? row.miss.map((h) => String(h).slice(0, 120)) : [],
      fb: String(row.fb ?? "").slice(0, 400),
      level: parseItemLevel(row.level),
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
    commandWord?: string;
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
