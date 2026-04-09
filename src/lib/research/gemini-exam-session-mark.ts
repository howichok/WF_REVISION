import { createHash } from "node:crypto";
import type {
  ExaminerWalkthroughBeat,
  GeminiExamMarkItem,
  GeminiExamMarkResponse,
} from "@/lib/exam-conditions";
import { parseItemLevel } from "@/lib/exam-conditions-marking-post";
import {
  buildGeminiCacheKey,
  createGeminiTimeoutSignal,
  getGeminiModePolicy,
  readGeminiCachedResponse,
  writeGeminiCachedResponse,
} from "@/lib/research/gemini-policy";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

/** Cost-first default; override with GEMINI_EXAM_MARK_MODEL. */
const GEMINI_EXAM_MARK_MODEL_DEFAULT = "gemini-2.5-flash-lite";

const GEMINI_EXAM_MARK_MODEL =
  process.env.GEMINI_EXAM_MARK_MODEL?.trim() || GEMINI_EXAM_MARK_MODEL_DEFAULT;

/** One retry when lite fails (rate limits, unsupported feature). */
const GEMINI_EXAM_MARK_FALLBACK_MODEL =
  process.env.GEMINI_EXAM_MARK_FALLBACK_MODEL?.trim() || "gemini-2.5-flash";

/** Bumps when prompt/schema shape changes — avoids stale in-memory cache hits. */
const EXAM_SESSION_MARK_CACHE_VERSION = "v2";

export interface GenerateExamSessionGeminiMarksResult {
  response: GeminiExamMarkResponse;
  /** True when the JSON needed repair (missing fields); marks were still applied. */
  recovered: boolean;
}

interface GeminiExamMarkCachePayload {
  response: GeminiExamMarkResponse;
  recovered: boolean;
}

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
  const answerCap = input.answer.length > 2200 ? 1400 : 800;
  return {
    i: input.id,
    x: input.marks,
    s: input.markSchemeSummary.replace(/\s+/g, " ").trim().slice(0, 420),
    e: input.expectation.replace(/\s+/g, " ").trim().slice(0, 260),
    q: input.prompt.replace(/\s+/g, " ").trim().slice(0, 180),
    cw: (input.commandWord ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
    a: input.answer.replace(/\s+/g, " ").trim().slice(0, answerCap),
  };
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          m: { type: "integer" },
          rc: {
            type: "string",
            enum: ["correct", "partial", "incorrect", "off_topic"],
          },
          mk: {
            type: "array",
            items: { type: "string" },
            maxItems: 3,
          },
        },
        required: ["id", "m", "rc", "mk"],
        additionalProperties: false,
      },
    },
    opening: { type: "string" },
    walkthrough: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          line: { type: "string" },
          note: { type: "string" },
        },
        required: ["id", "line", "note"],
        additionalProperties: false,
      },
    },
    band: { type: "string" },
    oneLiner: { type: "string" },
    examinerNote: { type: "string" },
    whatWentWell: { type: "string" },
    targetsToImprove: { type: "string" },
  },
  required: [
    "items",
    "opening",
    "walkthrough",
    "band",
    "oneLiner",
    "examinerNote",
    "whatWentWell",
    "targetsToImprove",
  ],
  additionalProperties: false,
};

function buildSystemInstruction(subjectLabel: string): string {
  const subject = subjectLabel.replace(/\s+/g, " ").trim().slice(0, 96) || "Digital Services & Data";
  return (
    `You are a GCSE ${subject} examiner marking one candidate paper in one pass. Output JSON only, no markdown. ` +
    "Tone: calm, professional, second person; you are going through their script question by question, not giving a vague summary only. " +
    "Field `items`: for each compact row use student answer `a` and scheme `s`,`e`,`q`,`cw`. Integer `m` from 0 to `x` inclusive. " +
    "`rc`: correct|partial|incorrect|off_topic. `mk`: max 3 short missing keywords (empty array if none). " +
    "Field `opening`: 1–2 sentences as if you have just finished reading the whole paper before you comment per question. " +
    "Field `walkthrough`: one object per question in the SAME ORDER as `items` / payload `items`; `id` must equal that row's `i`. " +
    "`line` is a short lead-in (e.g. 'On this one you…'); `note` is 2–3 sentences on that answer and the marks. " +
    "Cover every question; if an answer is empty, say so briefly. " +
    "Field `band`: one of Below | Pass | Merit | Strong (approximate). " +
    "`oneLiner`: one sentence overall judgement. `examinerNote`: one short caveat about AI marking limits (max ~200 chars). " +
    "`whatWentWell` and `targetsToImprove`: whole-paper strengths and next steps (not repeating the walkthrough verbatim)."
  );
}

const REASON_LABEL: Record<string, string> = {
  correct: "Meets the mark scheme.",
  partial: "Partial match to the scheme.",
  incorrect: "Does not meet the scheme.",
  off_topic: "Off-topic or not addressing the question.",
};

function expandMicroItem(
  row: { id?: string; m?: number; rc?: string; mk?: string[] },
  maxById: Map<string, number>
): GeminiExamMarkItem {
  const idKey = String(row.id ?? "");
  const max = Math.max(1, maxById.get(idKey) ?? 1);
  const mRaw = typeof row.m === "number" ? row.m : Number(row.m) || 0;
  const m = Math.max(0, Math.min(max, Math.round(mRaw)));
  const rc = String(row.rc ?? "incorrect").toLowerCase().trim();
  const mk = Array.isArray(row.mk)
    ? row.mk.map((s) => String(s).replace(/\s+/g, " ").trim().slice(0, 72)).filter(Boolean).slice(0, 3)
    : [];

  const ratio = max > 0 ? m / max : 0;
  const level =
    ratio >= 0.85 ? "detailed" : ratio >= 0.55 ? "clear" : ratio >= 0.28 ? "basic" : "none";

  const why = `${REASON_LABEL[rc] ?? REASON_LABEL.incorrect}${mk.length ? ` Gaps: ${mk.join("; ")}.` : ""}`.slice(
    0,
    420
  );
  const hit =
    rc === "correct" || rc === "partial"
      ? ["Aligned with scheme cues"]
      : [];
  const fb =
    mk.length > 0
      ? `Next: ${mk[0] ?? "review scheme"}.`.slice(0, 200)
      : (REASON_LABEL[rc] ?? "Check the mark scheme.").slice(0, 200);

  return {
    id: idKey,
    m,
    hit,
    miss: mk.length > 0 ? mk : rc === "correct" ? [] : ["Gap vs scheme"],
    fb,
    why,
    evidence: [],
    level: parseItemLevel(level),
  };
}

function normaliseWalkthrough(
  raw: unknown,
  orderedIds: string[]
): ExaminerWalkthroughBeat[] {
  if (!Array.isArray(raw)) {
    return orderedIds.map((id) => ({
      id,
      line: "",
      note: "",
    }));
  }

  const byId = new Map<string, ExaminerWalkthroughBeat>();
  for (const row of raw) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const o = row as { id?: string; line?: string; note?: string };
    const id = String(o.id ?? "").trim();
    if (!id || byId.has(id)) {
      continue;
    }
    byId.set(id, {
      id,
      line: String(o.line ?? "").replace(/\s+/g, " ").trim(),
      note: String(o.note ?? "").replace(/\s+/g, " ").trim(),
    });
  }

  return orderedIds.map((id) => {
    const w = byId.get(id);
    if (w) {
      return w;
    }
    return { id, line: "", note: "" };
  });
}

/**
 * Lenient parse: keeps marks when the model returns valid `items` but omits or mistypes prose fields.
 * Returns null when JSON is invalid or `items` cannot be read (caller may retry the API).
 */
function tryParseExamMarkResponse(
  text: string,
  maxById: Map<string, number>,
  orderedIds: string[]
): GenerateExamSessionGeminiMarksResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.items) || p.items.length === 0) {
    return null;
  }

  let recovered = false;
  if (!Array.isArray(p.walkthrough)) {
    recovered = true;
  }

  const strField = (key: string): string => {
    if (!(key in p)) {
      recovered = true;
      return "";
    }
    const v = p[key];
    if (typeof v !== "string") {
      if (v !== undefined && v !== null) {
        recovered = true;
      }
      return "";
    }
    return v.replace(/\s+/g, " ").trim();
  };

  try {
    const items = (p.items as unknown[]).map((row) =>
      expandMicroItem(row as { id?: string; m?: number; rc?: string; mk?: string[] }, maxById)
    );

    return {
      recovered,
      response: {
        band: strField("band"),
        oneLiner: strField("oneLiner"),
        examinerNote: strField("examinerNote"),
        whatWentWell: strField("whatWentWell"),
        targetsToImprove: strField("targetsToImprove"),
        opening: strField("opening"),
        walkthrough: normaliseWalkthrough(p.walkthrough, orderedIds),
        items,
      },
    };
  } catch {
    return null;
  }
}

async function callGeminiExamMark(
  model: string,
  userPayload: string,
  policy: ReturnType<typeof getGeminiModePolicy>,
  systemInstruction: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const useThinkingOff = model.includes("2.5-flash") && !model.includes("lite");

  const generationConfig: Record<string, unknown> = {
    temperature: 0,
    topP: 0.9,
    candidateCount: 1,
    maxOutputTokens: policy.maxOutputTokens,
    responseMimeType: "application/json",
    responseJsonSchema: RESPONSE_SCHEMA,
  };
  if (useThinkingOff) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPayload }],
      },
    ],
    generationConfig,
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
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
  return responseText;
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
  }>,
  options?: { subjectLabel?: string }
): Promise<GenerateExamSessionGeminiMarksResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  if (rows.length === 0) {
    throw new Error("No items to mark.");
  }

  if (rows.length > 30) {
    throw new Error("Too many questions for one marking request.");
  }

  const policy = getGeminiModePolicy("exam-session-mark");
  const compact = rows.map(compactRow);
  const orderedIds = rows.map((r) => r.id);
  const subjectLabel = (options?.subjectLabel ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const systemInstruction = buildSystemInstruction(subjectLabel);

  const userPayload = JSON.stringify({
    topic: "exam",
    subjectLabel,
    n: compact.length,
    items: compact,
    questionOrderIds: orderedIds,
  });
  const maxById = new Map(rows.map((r) => [r.id, r.marks]));
  const payloadHash = createHash("sha256").update(userPayload).digest("hex");

  let usedModel = GEMINI_EXAM_MARK_MODEL;
  const tryCacheKey = buildGeminiCacheKey(
    "exam-session-mark",
    EXAM_SESSION_MARK_CACHE_VERSION,
    usedModel,
    payloadHash
  );
  const cached = readGeminiCachedResponse<GeminiExamMarkCachePayload>(tryCacheKey);
  if (cached?.response) {
    return { response: cached.response, recovered: Boolean(cached.recovered) };
  }

  let responseText: string;
  try {
    responseText = await callGeminiExamMark(GEMINI_EXAM_MARK_MODEL, userPayload, policy, systemInstruction);
  } catch (primaryError) {
    if (GEMINI_EXAM_MARK_FALLBACK_MODEL && GEMINI_EXAM_MARK_FALLBACK_MODEL !== GEMINI_EXAM_MARK_MODEL) {
      usedModel = GEMINI_EXAM_MARK_FALLBACK_MODEL;
      const fbKey = buildGeminiCacheKey(
        "exam-session-mark",
        EXAM_SESSION_MARK_CACHE_VERSION,
        usedModel,
        payloadHash
      );
      const fbCached = readGeminiCachedResponse<GeminiExamMarkCachePayload>(fbKey);
      if (fbCached?.response) {
        return { response: fbCached.response, recovered: Boolean(fbCached.recovered) };
      }
      responseText = await callGeminiExamMark(usedModel, userPayload, policy, systemInstruction);
    } else {
      throw primaryError;
    }
  }

  let outcome = tryParseExamMarkResponse(responseText, maxById, orderedIds);
  if (!outcome) {
    responseText = await callGeminiExamMark(usedModel, userPayload, policy, systemInstruction);
    outcome = tryParseExamMarkResponse(responseText, maxById, orderedIds);
  }

  if (!outcome) {
    throw new Error(
      "The marking service returned data we could not read. Your answers are safe — try submitting again in a moment."
    );
  }

  const cachePayload: GeminiExamMarkCachePayload = {
    response: outcome.response,
    recovered: outcome.recovered,
  };
  writeGeminiCachedResponse(
    "exam-session-mark",
    buildGeminiCacheKey("exam-session-mark", EXAM_SESSION_MARK_CACHE_VERSION, usedModel, payloadHash),
    cachePayload
  );
  return outcome;
}
