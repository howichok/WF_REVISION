import { createHash } from "node:crypto";
import type {
  AnswerHighlightQuotes,
  AnswerHighlightSpans,
  ExamAnnotation,
  ExaminerWalkthroughBeat,
  GeminiExamMarkItem,
  GeminiExamMarkResponse,
} from "@/lib/exam-conditions";
import { parseItemLevel } from "@/lib/exam-conditions-marking-post";
import { resolveExamMarkCachedContentName } from "@/lib/research/gemini-context-cache";
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

/**
 * Env knobs (exam marking):
 * - GEMINI_EXAM_MARK_MODEL / GEMINI_EXAM_MARK_FALLBACK_MODEL
 * - GEMINI_EXAM_MARK_THINKING_BUDGET (0–24576; when set, overrides default thinking for this call)
 * - GEMINI_EXAM_MARK_CACHED_CONTENT (resource name, e.g. cachedContents/abc)
 * - GEMINI_EXAM_MARK_EXPLICIT_CACHE_AUTO=1 + GEMINI_EXAM_MARK_EXPLICIT_CACHE_MIN_CHARS (default 4096) + GEMINI_EXAM_MARK_EXPLICIT_CACHE_TTL_SECONDS (default 3600)
 */
/** Bumps when prompt/schema shape changes — avoids stale in-memory cache hits. */
const EXAM_SESSION_MARK_CACHE_VERSION = "v7";

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
  usageMetadata?: unknown;
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

function extractGeminiResponseTextRaw(payload: GeminiGenerateContentResponse) {
  return payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
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
  return incomingText;
}

async function consumeGeminiSseToText(
  response: Response,
  onDelta: (chunk: string) => void | Promise<void>
): Promise<string> {
  if (!response.body) {
    throw new Error("Gemini stream did not return a response body.");
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
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";

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

      const text = extractGeminiResponseTextRaw(payload);
      if (!text) {
        continue;
      }

      const delta = getNovelChunk(assembled, text);
      if (!delta) {
        continue;
      }
      assembled += delta;
      await onDelta(delta);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const blocks = buffer.split(/\r?\n\r?\n/);
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
      const text = extractGeminiResponseTextRaw(payload);
      if (!text) {
        continue;
      }
      const delta = getNovelChunk(assembled, text);
      if (delta) {
        assembled += delta;
        await onDelta(delta);
      }
    }
  }

  return assembled.trim();
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
    /** Same string the model must use for `hl` UTF-16 spans: trim ends only (do not collapse spaces). */
    a: input.answer.trim().slice(0, answerCap),
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
            maxItems: 2,
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
          hl: {
            type: "object",
            properties: {
              c: {
                type: "array",
                maxItems: 6,
                items: {
                  type: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: { type: "integer" },
                },
              },
              i: {
                type: "array",
                maxItems: 6,
                items: {
                  type: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: { type: "integer" },
                },
              },
            },
            additionalProperties: false,
          },
          hlq: {
            type: "object",
            properties: {
              c: { type: "array", maxItems: 6, items: { type: "string" } },
              i: { type: "array", maxItems: 6, items: { type: "string" } },
            },
            additionalProperties: false,
          },
          annotations: {
            type: "array",
            maxItems: 6,
            items: {
              type: "object",
              properties: {
                quote: { type: "string" },
                kind: { type: "string", enum: ["c", "i"] },
                why: { type: "string" },
              },
              required: ["quote", "kind", "why"],
              additionalProperties: false,
            },
          },
        },
        required: ["id", "line", "note"],
        additionalProperties: false,
      },
    },
    band: { type: "string" },
    oneLiner: { type: "string" },
    whatWentWell: { type: "string" },
    targetsToImprove: { type: "string" },
  },
  required: [
    "items",
    "opening",
    "walkthrough",
    "band",
    "oneLiner",
    "whatWentWell",
    "targetsToImprove",
  ],
  additionalProperties: false,
};

/** Subject-agnostic rubric tail (stable prefix for implicit cache + optional explicit context cache). */
const EXAM_MARK_RUBRIC_TAIL =
  "Output JSON only, no markdown. " +
  "Tone: calm, professional, second person; walk through their script question by question. " +
  "The last user message JSON has keys in order: n, questionOrderIds, items. Subject and exam paper framing are in the system instruction. " +
  "Field `items`: for each compact row use student answer `a` and scheme `s`,`e`,`q`,`cw`. Integer `m` from 0 to `x` inclusive. " +
  "`rc`: correct|partial|incorrect|off_topic. `mk`: max 2 short missing keywords (empty array if none). " +
  "Field `opening`: exactly one sentence after reading the whole paper. " +
  "Field `walkthrough`: one object per question in the SAME ORDER as `items`; `id` must equal that row's `i`. " +
  "`line` is a short lead-in (e.g. 'On this one you…'); `note` is up to 2 sentences on that answer and the marks (target ≤220 chars). " +
  "PRIMARY feedback anchors: field `annotations` on each walkthrough row — array of up to 6 objects. " +
  "Each has `quote` (exact verbatim substring from that row's `a`, min 4 chars, max ~120), `kind` `c` (earned credit) or `i` (needs improving), and `why` (≤80 chars: what was strong or what to fix). " +
  "Omit `annotations` or use [] if the answer is empty. Prefer `annotations` over integer spans. " +
  "Optional `hl`: UTF-16 [start,end) spans into `a` (max 6 per kind); additive only. `hl.c` credit, `hl.i` improve. " +
  "Optional `hlq`: verbatim quotes from `a` (max 6 per kind) if you also output spans — usually unnecessary when `annotations` is filled. " +
  "When `m` == `x`, keep `note` brief and positive; `annotations` may be empty or one short credit. " +
  "Cover every question; if an answer is empty, say so briefly. " +
  "Field `band`: one of Below | Pass | Merit | Strong (approximate). " +
  "`oneLiner`: one sentence overall judgement. " +
  "`whatWentWell` and `targetsToImprove`: whole-paper strengths and next steps (not repeating the walkthrough). " +
  "Keep each `line` under ~100 chars to save tokens.";

function buildExamMarkSubjectOpener(subjectLabel: string): string {
  const subject = subjectLabel.replace(/\s+/g, " ").trim().slice(0, 96) || "Digital Services & Data";
  return `You are a GCSE ${subject} examiner marking one candidate paper in one pass.`;
}

function buildSystemInstruction(subjectLabel: string): string {
  return `${buildExamMarkSubjectOpener(subjectLabel)} ${EXAM_MARK_RUBRIC_TAIL}`;
}

function buildSystemInstructionWithCachedRubric(subjectLabel: string): string {
  return `${buildExamMarkSubjectOpener(subjectLabel)} Follow the detailed marking contract in the cached context block immediately before this message.`;

}

/** User JSON: stable key order; `items` last to maximise implicit-prefix cache hits on the shared prefix. */
function buildExamMarkUserPayload(
  compact: ReturnType<typeof compactRow>[],
  orderedIds: string[]
): string {
  const payload: Record<string, unknown> = {
    n: compact.length,
    questionOrderIds: orderedIds,
    items: compact,
  };
  return JSON.stringify(payload);
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
    ? row.mk.map((s) => String(s).replace(/\s+/g, " ").trim().slice(0, 72)).filter(Boolean).slice(0, 2)
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

function normaliseWalkthroughPhraseList(raw: unknown, maxItems: number, maxLen: number): string[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const out = raw
    .map((v) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, maxLen))
    .filter((s) => s.length >= 4)
    .slice(0, maxItems);
  return out.length > 0 ? out : undefined;
}

function normaliseSpanPairs(raw: unknown, maxPairs: number): [number, number][] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const out: [number, number][] = [];
  for (const pair of raw) {
    if (!Array.isArray(pair) || pair.length !== 2) {
      continue;
    }
    const a = Math.round(Number(pair[0]));
    const b = Math.round(Number(pair[1]));
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      continue;
    }
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    if (end > start) {
      out.push([start, end]);
    }
    if (out.length >= maxPairs) {
      break;
    }
  }
  return out.length > 0 ? out : undefined;
}

function normaliseHighlightSpans(raw: unknown): AnswerHighlightSpans | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as { c?: unknown; i?: unknown };
  const c = normaliseSpanPairs(o.c, 6);
  const i = normaliseSpanPairs(o.i, 6);
  if (!c && !i) {
    return undefined;
  }
  return { ...(c ? { c } : {}), ...(i ? { i } : {}) };
}

function normaliseHlQuotes(raw: unknown): AnswerHighlightQuotes | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const o = raw as { c?: unknown; i?: unknown };
  const norm = (v: unknown) =>
    Array.isArray(v)
      ? v
          .map((x) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, 120))
          .filter((s) => s.length >= 2)
          .slice(0, 6)
      : [];
  const c = norm(o.c);
  const i = norm(o.i);
  if (c.length === 0 && i.length === 0) {
    return undefined;
  }
  return { ...(c.length ? { c } : {}), ...(i.length ? { i } : {}) };
}

function normaliseAnnotations(raw: unknown): ExamAnnotation[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const out: ExamAnnotation[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const o = row as { quote?: unknown; kind?: unknown; why?: unknown };
    const quote = String(o.quote ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    const kind = o.kind === "c" || o.kind === "i" ? o.kind : null;
    const why = String(o.why ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (quote.length < 4 || !kind || why.length < 1) {
      continue;
    }
    out.push({ quote, kind, why });
    if (out.length >= 6) {
      break;
    }
  }
  return out.length > 0 ? out : undefined;
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
    const o = row as {
      id?: string;
      line?: string;
      note?: string;
      hl?: unknown;
      hlq?: unknown;
      annotations?: unknown;
      credit?: unknown;
      improve?: unknown;
    };
    const id = String(o.id ?? "").trim();
    if (!id || byId.has(id)) {
      continue;
    }
    const hl = normaliseHighlightSpans(o.hl);
    const hlQuotes = normaliseHlQuotes(o.hlq);
    const annotations = normaliseAnnotations(o.annotations);
    byId.set(id, {
      id,
      line: String(o.line ?? "").replace(/\s+/g, " ").trim(),
      note: String(o.note ?? "").replace(/\s+/g, " ").trim(),
      hl,
      hlQuotes,
      annotations,
      credit: normaliseWalkthroughPhraseList(o.credit, 4, 200),
      improve: normaliseWalkthroughPhraseList(o.improve, 4, 200),
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

function buildExamMarkGenerationConfig(
  model: string,
  policy: ReturnType<typeof getGeminiModePolicy>
): Record<string, unknown> {
  const useThinkingOff = model.includes("2.5-flash") && !model.includes("lite");
  const thinkingBudgetRaw = process.env.GEMINI_EXAM_MARK_THINKING_BUDGET?.trim();
  const thinkingBudgetParsed =
    thinkingBudgetRaw !== undefined && thinkingBudgetRaw !== ""
      ? Number.parseInt(thinkingBudgetRaw, 10)
      : Number.NaN;
  const useExplicitThinking = Number.isFinite(thinkingBudgetParsed) && thinkingBudgetParsed >= 0;

  const generationConfig: Record<string, unknown> = {
    temperature: 0,
    topP: 0.9,
    candidateCount: 1,
    maxOutputTokens: policy.maxOutputTokens,
    responseMimeType: "application/json",
    responseJsonSchema: RESPONSE_SCHEMA,
  };

  if (useExplicitThinking) {
    generationConfig.thinkingConfig = { thinkingBudget: thinkingBudgetParsed };
  } else if (useThinkingOff) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  return generationConfig;
}

function logExamMarkUsage(payload: GeminiGenerateContentResponse) {
  if (!payload.usageMetadata) {
    return;
  }
  if (process.env.NODE_ENV !== "development" && process.env.EXAM_MARK_ANALYTICS !== "1") {
    return;
  }
  console.info(
    JSON.stringify({
      tag: "exam-mark-usage",
      usageMetadata: payload.usageMetadata,
    })
  );
}

async function resolveExamMarkCachedContentRef(model: string): Promise<string | undefined> {
  if (!GEMINI_API_KEY) {
    return undefined;
  }
  const minChars =
    Number.parseInt(process.env.GEMINI_EXAM_MARK_EXPLICIT_CACHE_MIN_CHARS ?? "4096", 10) || 4096;
  const ttlSeconds =
    Number.parseInt(process.env.GEMINI_EXAM_MARK_EXPLICIT_CACHE_TTL_SECONDS ?? "3600", 10) || 3600;
  try {
    return await resolveExamMarkCachedContentName({
      apiKey: GEMINI_API_KEY,
      modelId: model,
      rubricForCache: EXAM_MARK_RUBRIC_TAIL,
      minCharsForAuto: minChars,
      ttlSeconds,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[exam-mark] context cache unavailable:", error);
    }
    return undefined;
  }
}

async function callGeminiExamMark(
  model: string,
  userPayload: string,
  policy: ReturnType<typeof getGeminiModePolicy>,
  systemInstructionFull: string,
  subjectLabel: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const cachedRef = await resolveExamMarkCachedContentRef(model);
  const systemInstruction = cachedRef
    ? buildSystemInstructionWithCachedRubric(subjectLabel)
    : systemInstructionFull;

  const generationConfig = buildExamMarkGenerationConfig(model, policy);

  const body: Record<string, unknown> = {
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

  if (cachedRef) {
    body.cachedContent = cachedRef;
  }

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

  logExamMarkUsage(payload);

  const responseText = extractResponseText(payload);
  if (!responseText) {
    throw new Error("Gemini returned empty marking response.");
  }
  return responseText;
}

async function callGeminiExamMarkStream(
  model: string,
  userPayload: string,
  policy: ReturnType<typeof getGeminiModePolicy>,
  systemInstructionFull: string,
  subjectLabel: string,
  onDelta: (chunk: string) => void | Promise<void>
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  const cachedRef = await resolveExamMarkCachedContentRef(model);
  const systemInstruction = cachedRef
    ? buildSystemInstructionWithCachedRubric(subjectLabel)
    : systemInstructionFull;

  const generationConfig = buildExamMarkGenerationConfig(model, policy);

  const body: Record<string, unknown> = {
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

  if (cachedRef) {
    body.cachedContent = cachedRef;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
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

  if (!response.ok) {
    const errText = await response.text();
    let message = errText || "Gemini exam marking stream failed.";
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string } };
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      /* keep message */
    }
    throw new Error(message);
  }

  return consumeGeminiSseToText(response, onDelta);
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

  const userPayload = buildExamMarkUserPayload(compact, orderedIds);
  const maxById = new Map(rows.map((r) => [r.id, r.marks]));
  const payloadHash = createHash("sha256")
    .update(
      JSON.stringify({
        topic: "exam",
        subjectLabel,
        n: compact.length,
        questionOrderIds: orderedIds,
        items: compact,
      })
    )
    .digest("hex");

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
    responseText = await callGeminiExamMark(
      GEMINI_EXAM_MARK_MODEL,
      userPayload,
      policy,
      systemInstruction,
      subjectLabel
    );
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
      responseText = await callGeminiExamMark(usedModel, userPayload, policy, systemInstruction, subjectLabel);
    } else {
      throw primaryError;
    }
  }

  let outcome = tryParseExamMarkResponse(responseText, maxById, orderedIds);
  if (!outcome) {
    responseText = await callGeminiExamMark(usedModel, userPayload, policy, systemInstruction, subjectLabel);
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

/**
 * Same contract as {@link generateExamSessionGeminiMarks}, but uses Gemini streaming for lower perceived latency.
 */
export async function streamExamSessionGeminiMarks(
  rows: Array<{
    id: string;
    marks: number;
    prompt: string;
    expectation: string;
    markSchemeSummary: string;
    commandWord?: string;
    answer: string;
  }>,
  options: { subjectLabel?: string; onDelta: (chunk: string) => void | Promise<void> }
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

  const userPayload = buildExamMarkUserPayload(compact, orderedIds);
  const maxById = new Map(rows.map((r) => [r.id, r.marks]));
  const payloadHash = createHash("sha256")
    .update(
      JSON.stringify({
        topic: "exam",
        subjectLabel,
        n: compact.length,
        questionOrderIds: orderedIds,
        items: compact,
      })
    )
    .digest("hex");

  let usedModel = GEMINI_EXAM_MARK_MODEL;
  const tryCacheKey = buildGeminiCacheKey(
    "exam-session-mark",
    EXAM_SESSION_MARK_CACHE_VERSION,
    usedModel,
    payloadHash
  );
  const cached = readGeminiCachedResponse<GeminiExamMarkCachePayload>(tryCacheKey);
  if (cached?.response) {
    await options.onDelta("");
    return { response: cached.response, recovered: Boolean(cached.recovered) };
  }

  let responseText: string;
  try {
    responseText = await callGeminiExamMarkStream(
      GEMINI_EXAM_MARK_MODEL,
      userPayload,
      policy,
      systemInstruction,
      subjectLabel,
      options.onDelta
    );
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
        await options.onDelta("");
        return { response: fbCached.response, recovered: Boolean(fbCached.recovered) };
      }
      responseText = await callGeminiExamMarkStream(
        usedModel,
        userPayload,
        policy,
        systemInstruction,
        subjectLabel,
        options.onDelta
      );
    } else {
      throw primaryError;
    }
  }

  let outcome = tryParseExamMarkResponse(responseText, maxById, orderedIds);
  if (!outcome) {
    responseText = await callGeminiExamMark(usedModel, userPayload, policy, systemInstruction, subjectLabel);
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
