import {
  CONTENT_SOURCES,
  type QuestionMetadata,
} from "@/data/curriculum";
import type { ContentSourceKind } from "@/data/curriculum/types";
import { getMarkSchemeConceptsForQuestion, getTopicContentBundle } from "@/lib/content";
import { getTopicById, type TopicId } from "@/lib/types";
import {
  evaluatePracticeShortAnswer,
  type PracticeShortAnswerEvaluation,
} from "@/lib/practice-evaluator";
import { extractCommandWord } from "@/lib/command-words";
import {
  resolveSharedCurriculumSnapshot,
  type SharedCurriculumSnapshot,
} from "@/lib/shared-curriculum";
import type { PracticePaper } from "@/lib/practice";
import {
  ensureCompleteGeminiItems,
  geminiVsLocalLowConfidence,
  parseItemLevel,
  reconcileOverallBand,
} from "@/lib/exam-conditions-marking-post";

export type ExamConditionsDifficulty = "easy" | "medium" | "hard";

/** Session mix: all difficulties balanced vs single level only. */
export type ExamConditionsDifficultyMode = "mixed" | ExamConditionsDifficulty;

export function parseExamConditionsDifficultyParam(
  raw: string | null | undefined
): ExamConditionsDifficultyMode | undefined {
  if (raw == null || raw === "") {
    return undefined;
  }
  const value = raw.trim().toLowerCase();
  if (value === "mixed" || value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return undefined;
}

/** Where the on-screen stem text came from. */
export type ExamQuestionStemOrigin = "past-paper" | "paper-set" | "practice";

const CURATED_PAPER_SOURCE_IDS = new Set(["curated-paper1-practice", "curated-paper2-practice"]);
const WORKSHEET_MICRO_DRILL_SOURCE_IDS = new Set([
  "teach-csv-data-formats-worksheet",
  "teach-pack-big-data-worksheet",
]);

export interface ExamConditionsQuestion {
  id: string;
  topicId: string;
  title: string;
  prompt: string;
  sourceLabel: string;
  /** Exam series year when known (released papers). */
  year?: number;
  marks: number;
  questionType: QuestionMetadata["questionType"];
  difficulty: ExamConditionsDifficulty;
  paper?: string;
  expectation: string;
  acceptableAnswers: string[];
  evaluationProfile?: QuestionMetadata["evaluationProfile"];
  /** Condensed mark-scheme cues for end-of-session AI marking (single request). */
  markSchemeSummary: string;
  /** `past-paper` / `paper-set` use exam-style summary text; `practice` uses the shorter practice prompt. */
  stemOrigin?: ExamQuestionStemOrigin;
}

export interface ExamConditionsSession {
  topicId: string;
  questionCount: number;
  estimatedMinutes: number;
  questions: ExamConditionsQuestion[];
  /** Released past-paper stems in this session. */
  releasedPastPaperStemCount?: number;
  /** Past-paper + Pearson-style Paper 1/2 curated sets (closer to exam wording than generic practice). */
  examStyleStemCount?: number;
  pinnedQuestionId?: string;
  /** Chosen paper size before pool capping (10 / 20 / 30). */
  plannedQuestionCount?: number;
  /** Per-topic counts actually drawn (single- or multi-topic). */
  topicMix?: Array<{ topicId: string; label: string; count: number }>;
}

export type ExamGeminiItemLevel = "none" | "basic" | "clear" | "detailed";

export interface ExamMarkingSessionMeta {
  usedGemini: boolean;
  /** When AI was not called but could have been — short reason for the student. */
  aiSkippedNote?: string;
  /** Questions scored by the model in this request (rest used fast local). */
  geminiQuestionCount?: number;
  /** Questions scored only with the fast local checker. */
  localQuestionCount?: number;
  /**
   * True when the model JSON was repaired (e.g. missing examiner fields) but per-question marks were kept.
   * Optional note for support; students usually only see aiSkippedNote when relevant.
   */
  markingResponseRecovered?: boolean;
}

export interface ExamConditionsSessionResult {
  reviews: ExamConditionsReview[];
  totalScore: number;
  totalMaxScore: number;
  scorePercent: number;
  answeredCount: number;
  markingProvider?: "gemini" | "local";
  /** Short overall judgement, e.g. Pass / Merit / Strong */
  overallBand?: string;
  overallSummary?: string;
  /** When true, overallBand was derived from the numeric score because the model band diverged. */
  bandOverriddenToMatchMarks?: boolean;
  /** Optional note from the model about limitations of AI marking. */
  examinerNote?: string;
  examMarkingMeta?: ExamMarkingSessionMeta;
  /** Whole-paper closing feedback (AI when Gemini; heuristic when local). */
  sessionClosingFeedback?: {
    whatWentWell: string;
    targetsToImprove: string;
  };
  /** Examiner voice-over (from the same Gemini response as marks). */
  examinerOpening?: string;
  examinerWalkthrough?: ExaminerWalkthroughBeat[];
}

export interface ExamConditionsReview {
  question: ExamConditionsQuestion;
  answer: string;
  evaluation: PracticeShortAnswerEvaluation;
  score: number;
  maxScore: number;
  scorePercent: number;
  /** Extra examiner-style fields when markingProvider is gemini. */
  geminiMarking?: {
    why: string;
    evidence: string[];
    level: ExamGeminiItemLevel;
    lowConfidence: boolean;
  };
}

/** Parsed from Gemini JSON (one batch response). */
export interface GeminiExamMarkItem {
  id: string;
  m: number;
  hit: string[];
  miss: string[];
  fb: string;
  why?: string;
  evidence?: string[];
  level?: ExamGeminiItemLevel;
}

/**
 * Compact highlight contract: UTF-16 code-unit offsets into the candidate answer string
 * (same indexing as JavaScript `String`). Each span is half-open [start, end).
 * The client clamps and renders — the model must not echo answer text for highlighting.
 */
export interface AnswerHighlightSpans {
  c?: [number, number][];
  i?: [number, number][];
}

/** Verbatim substrings of the candidate answer for highlight anchoring when spans drift. */
export interface AnswerHighlightQuotes {
  c?: string[];
  i?: string[];
}

function highlightSpansCoherent(text: string, hl: AnswerHighlightSpans): boolean {
  const n = text.length;
  const checkPairs = (pairs?: [number, number][]) => {
    if (!pairs?.length) {
      return true;
    }
    for (const pair of pairs) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        return false;
      }
      const lo = Math.min(Math.round(pair[0]), Math.round(pair[1]));
      const hi = Math.max(Math.round(pair[0]), Math.round(pair[1]));
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi > n || hi <= lo) {
        return false;
      }
    }
    return true;
  };
  return checkPairs(hl.c) && checkPairs(hl.i);
}

function quotesToUtf16SpanPairs(text: string, quotes: string[]): [number, number][] {
  const spans: [number, number][] = [];
  let from = 0;
  for (const raw of quotes) {
    const s = raw.replace(/\s+/g, " ").trim();
    if (s.length < 2) {
      continue;
    }
    const idx = text.indexOf(s, from);
    if (idx === -1) {
      continue;
    }
    const end = idx + s.length;
    spans.push([idx, end]);
    from = end;
  }
  return spans;
}

function highlightSpansFromQuotes(text: string, q: AnswerHighlightQuotes): AnswerHighlightSpans | undefined {
  const c = quotesToUtf16SpanPairs(text, q.c ?? []);
  const blocked = c.map(([s, e]) => ({ start: s, end: e }));
  const iRaw = quotesToUtf16SpanPairs(text, q.i ?? []);
  const i = iRaw.filter((pair) => !blocked.some((b) => pair[0] < b.end && pair[1] > b.start));
  if (c.length === 0 && i.length === 0) {
    return undefined;
  }
  return { ...(c.length ? { c } : {}), ...(i.length ? { i } : {}) };
}

/**
 * Prefer coherent `hl` spans; otherwise derive spans from optional verbatim quotes.
 */
export function mergeHlQuotesIntoHighlightSpans(
  answerTrimmed: string,
  hl?: AnswerHighlightSpans,
  hlQuotes?: AnswerHighlightQuotes
): AnswerHighlightSpans | undefined {
  if (hl && highlightSpansCoherent(answerTrimmed, hl)) {
    const hasC = (hl.c?.length ?? 0) > 0;
    const hasI = (hl.i?.length ?? 0) > 0;
    if (hasC || hasI) {
      return hl;
    }
  }
  if (!hlQuotes) {
    return hl;
  }
  return highlightSpansFromQuotes(answerTrimmed, hlQuotes) ?? hl;
}

/** One step of the examiner “walking through” the paper (same order as questions). */
export interface ExaminerWalkthroughBeat {
  id: string;
  /** Short lead-in, e.g. “On this one you…” */
  line: string;
  /** Voice note on that answer (2–3 sentences). */
  note: string;
  /** Preferred: machine spans only — minimal tokens vs verbatim `credit`/`improve` strings. */
  hl?: AnswerHighlightSpans;
  /** Optional verbatim quotes from the candidate answer (paired with hl when spans are unreliable). */
  hlQuotes?: AnswerHighlightQuotes;
  /**
   * Legacy: verbatim snippets (older cached marks). UI falls back when `hl` is absent.
   * @deprecated Prefer {@link hl}
   */
  credit?: string[];
  improve?: string[];
}

export interface GeminiExamMarkResponse {
  band: string;
  oneLiner: string;
  items: GeminiExamMarkItem[];
  examinerNote?: string;
  whatWentWell?: string;
  targetsToImprove?: string;
  /** Examiner opens the review. */
  opening?: string;
  /** Per-question voice — must cover every question id once, session order. */
  walkthrough?: ExaminerWalkthroughBeat[];
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function shuffleArray<T>(values: T[]) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function inferDifficulty(question: QuestionMetadata): ExamConditionsDifficulty {
  let score = question.marks ?? 4;

  if (question.questionType === "extended-response" || question.questionType === "scenario") {
    score += 2;
  } else if (question.questionType === "medium-open") {
    score += 1;
  }

  const commandWord = extractCommandWord(question.practicePrompt)?.id;
  if (
    commandWord === "evaluate" ||
    commandWord === "compare" ||
    commandWord === "discuss" ||
    commandWord === "justify" ||
    commandWord === "analyse"
  ) {
    score += 2;
  } else if (commandWord === "explain" || commandWord === "describe") {
    score += 1;
  }

  if (question.evaluationProfile?.depthExpectation === "developed") {
    score += 1;
  }

  if (score >= 8) {
    return "hard";
  }

  if (score >= 5) {
    return "medium";
  }

  return "easy";
}

function extractCues(question: QuestionMetadata, snapshot?: SharedCurriculumSnapshot | null) {
  const markSchemeCues = getMarkSchemeConceptsForQuestion(question.id, snapshot)
    .flatMap((concept) => concept.conceptTargets)
    .slice(0, 6);
  const expectationCues = question.expectation
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8)
    .slice(0, 3);

  return uniqueStrings([...markSchemeCues, ...expectationCues]);
}

function buildMarkSchemeSummary(question: QuestionMetadata, snapshot?: SharedCurriculumSnapshot | null) {
  const concepts = getMarkSchemeConceptsForQuestion(question.id, snapshot);
  if (concepts.length === 0) {
    return question.expectation.replace(/\s+/g, " ").trim().slice(0, 420);
  }

  return concepts
    .slice(0, 4)
    .map((c) => `${c.title}: ${c.summary.replace(/\s+/g, " ").trim().slice(0, 140)}`)
    .join(" | ")
    .slice(0, 480);
}

function getQuestionContentSourceKind(
  sourceId: string,
  snapshot?: SharedCurriculumSnapshot | null
): ContentSourceKind | undefined {
  return (
    resolveSharedCurriculumSnapshot(snapshot).sources.find((source) => source.id === sourceId)?.kind ??
    CONTENT_SOURCES.find((source) => source.id === sourceId)?.kind
  );
}

function isCuratedPaperSetSource(question: QuestionMetadata) {
  return CURATED_PAPER_SOURCE_IDS.has(question.sourceId);
}

function isWorksheetMicroDrill(question: QuestionMetadata) {
  const prompt = question.practicePrompt.toLowerCase();

  return (
    WORKSHEET_MICRO_DRILL_SOURCE_IDS.has(question.sourceId) ||
    question.id.startsWith("teach-pack-format-snippet-") ||
    question.id.endsWith("-fix-misconception") ||
    prompt.includes("format for this snippet") ||
    prompt.includes("which of the 6 vs best fits")
  );
}

function isExamConditionsEligibleQuestion(
  question: QuestionMetadata,
  snapshot?: SharedCurriculumSnapshot | null
) {
  if (question.questionType === "question-bank-section") {
    return false;
  }

  if (isWorksheetMicroDrill(question)) {
    return false;
  }

  const kind = getQuestionContentSourceKind(question.sourceId, snapshot);
  if (kind === "past-paper" || isCuratedPaperSetSource(question)) {
    return true;
  }

  const marks = question.marks ?? 4;
  if (marks >= 6) {
    return true;
  }

  if (marks >= 4 && question.questionType !== "short-open") {
    return true;
  }

  return false;
}

function getExamEligibleRawQuestions(
  questions: QuestionMetadata[],
  snapshot?: SharedCurriculumSnapshot | null
) {
  const preferred = questions.filter((question) =>
    isExamConditionsEligibleQuestion(question, snapshot)
  );

  if (preferred.length > 0) {
    return preferred;
  }

  return questions.filter(
    (question) => question.questionType !== "question-bank-section" && !isWorksheetMicroDrill(question)
  );
}

function getExamRawPoolForTopic(
  topicId: string,
  questions: QuestionMetadata[],
  snapshot?: SharedCurriculumSnapshot | null
) {
  const directTopicQuestions = questions.filter((question) =>
    question.legacyTopicIds.includes(topicId as TopicId)
  );
  const directEligible = getExamEligibleRawQuestions(directTopicQuestions, snapshot);

  if (directEligible.length > 0) {
    return directEligible;
  }

  return getExamEligibleRawQuestions(questions, snapshot);
}

/**
 * Past-paper and curated Paper 1/2 sets use the `summary` field (exam-style stem). Other items keep `practicePrompt`.
 */
function buildExamDisplayPrompt(
  question: QuestionMetadata,
  snapshot?: SharedCurriculumSnapshot | null
): { prompt: string; stemOrigin: ExamQuestionStemOrigin } {
  const kind = getQuestionContentSourceKind(question.sourceId, snapshot);
  if (kind === "past-paper") {
    const fromSummary = question.summary.replace(/\s+/g, " ").trim();
    if (fromSummary.length >= 16) {
      return { prompt: fromSummary, stemOrigin: "past-paper" };
    }
  }
  if (isCuratedPaperSetSource(question)) {
    const fromSummary = question.summary.replace(/\s+/g, " ").trim();
    if (fromSummary.length >= 16) {
      return { prompt: fromSummary, stemOrigin: "paper-set" };
    }
  }
  return {
    prompt: cleanExamPracticePrompt(question.practicePrompt, question.sourceId),
    stemOrigin: "practice",
  };
}

function cleanExamPracticePrompt(prompt: string, sourceId: string) {
  let cleaned = prompt.replace(/\s+/g, " ").trim();

  if (!sourceId.startsWith("generated-official-point-")) {
    return cleaned;
  }

  cleaned = cleaned
    .replace(/\bif a team ignores identify\b/gi, "if a team fails to identify")
    .replace(/\bif a team ignores apply\b/gi, "if a team fails to apply")
    .replace(/\bif a team ignores define\b/gi, "if a team fails to define")
    .replace(/\bif a team ignores design\b/gi, "if a team does not design")
    .replace(/\bif a team ignores select\b/gi, "if a team does not select")
    .replace(/\bif a team ignores understand\b/gi, "if a team does not consider")
    .replace(/\bwhen applying evaluate\b/gi, "when evaluating")
    .replace(/\bwhen applying understand\b/gi, "when applying")
    .replace(/\bwhen applying identify\b/gi, "when identifying")
    .replace(/\bwhen applying select\b/gi, "when selecting")
    .replace(/\bwhen applying apply\b/gi, "when applying")
    .replace(/\bwhen applying design\b/gi, "when designing")
    .replace(/\bbecause of apply\b/gi, "because of applying")
    .replace(/\bbecause of understand\b/gi, "because of")
    .replace(/\bbecause of design\b/gi, "because of designing")
    .replace(/\bbecause of identify\b/gi, "because of identifying")
    .replace(/\bbecause of select\b/gi, "because of selecting")
    .replace(/\btests and test data to\b/gi, "tests and test data for")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function shuffleExamStemPriority(pool: ExamConditionsQuestion[]) {
  const past = shuffleArray(pool.filter((q) => q.stemOrigin === "past-paper"));
  const paperSet = shuffleArray(pool.filter((q) => q.stemOrigin === "paper-set"));
  const rest = shuffleArray(pool.filter((q) => q.stemOrigin === "practice"));
  return [...past, ...paperSet, ...rest];
}

/** Drop duplicate curriculum rows (same id or same displayed stem) while keeping stem priority order. */
function dedupeExamEligibleQuestions(
  orderedRaw: QuestionMetadata[],
  snapshot?: SharedCurriculumSnapshot | null
): QuestionMetadata[] {
  const seenIds = new Set<string>();
  const seenPrompts = new Set<string>();
  const out: QuestionMetadata[] = [];

  for (const q of orderedRaw) {
    if (seenIds.has(q.id)) {
      continue;
    }
    const { prompt } = buildExamDisplayPrompt(q, snapshot);
    const key = prompt.replace(/\s+/g, " ").trim().toLowerCase();
    if (key.length >= 32 && seenPrompts.has(key)) {
      continue;
    }
    seenIds.add(q.id);
    if (key.length >= 32) {
      seenPrompts.add(key);
    }
    out.push(q);
  }

  return out;
}

/** Final guard: unique ids and stems in the ordered session list (e.g. after multi-topic merge). */
function dedupeExamConditionsQuestionList(questions: ExamConditionsQuestion[]): ExamConditionsQuestion[] {
  const seenId = new Set<string>();
  const seenPrompt = new Set<string>();
  const out: ExamConditionsQuestion[] = [];

  for (const q of questions) {
    if (seenId.has(q.id)) {
      continue;
    }
    const key = q.prompt.replace(/\s+/g, " ").trim().toLowerCase();
    if (key.length >= 32 && seenPrompt.has(key)) {
      continue;
    }
    seenId.add(q.id);
    if (key.length >= 32) {
      seenPrompt.add(key);
    }
    out.push(q);
  }

  return out;
}

function toExamConditionsQuestion(
  topicId: string,
  question: QuestionMetadata,
  snapshot?: SharedCurriculumSnapshot | null
): ExamConditionsQuestion {
  const acceptableAnswers = extractCues(question, snapshot);
  const { prompt, stemOrigin } = buildExamDisplayPrompt(question, snapshot);

  return {
    id: question.id,
    topicId,
    title: question.title,
    prompt,
    sourceLabel: question.sourceLabel,
    year: question.year,
    marks: question.marks ?? 4,
    questionType: question.questionType,
    difficulty: inferDifficulty(question),
    paper: question.paper,
    expectation: question.expectation,
    acceptableAnswers,
    evaluationProfile: question.evaluationProfile,
    markSchemeSummary: buildMarkSchemeSummary(question, snapshot),
    stemOrigin,
  };
}

/** Matches batch marking route limit (single Gemini request). */
export const EXAM_CONDITIONS_SESSION_MAX_QUESTIONS = 30;
/** Exam Questions sessions aim for at least this many when the pool allows. */
export const EXAM_CONDITIONS_SESSION_MIN_QUESTIONS = 5;

export const EXAM_QUESTION_SET_SIZES = [10, 20, 30] as const;
export type ExamQuestionSetSize = (typeof EXAM_QUESTION_SET_SIZES)[number];

export function isExamQuestionSetSize(value: number): value is ExamQuestionSetSize {
  return value === 10 || value === 20 || value === 30;
}

export function parseExamQuestionSetSizeParam(raw: string | null | undefined): ExamQuestionSetSize | undefined {
  if (raw == null || raw === "") {
    return undefined;
  }
  const n = Number.parseInt(raw, 10);
  return isExamQuestionSetSize(n) ? n : undefined;
}

/** `alloc=topicA:4,topicB:8` (topic ids must not contain `:` or `,`). */
export function parseExamTopicAllocationsParam(raw: string | null): Record<string, number> | null {
  if (!raw?.trim()) {
    return null;
  }
  const out: Record<string, number> = {};
  for (const seg of raw.split(",")) {
    const t = seg.trim();
    if (!t) {
      continue;
    }
    const idx = t.lastIndexOf(":");
    if (idx <= 0 || idx === t.length - 1) {
      return null;
    }
    const topicId = t.slice(0, idx).trim();
    const n = Number.parseInt(t.slice(idx + 1), 10);
    if (!topicId || !Number.isFinite(n) || n < 0) {
      return null;
    }
    out[topicId] = n;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function serializeExamTopicAllocationsParam(alloc: Record<string, number>): string {
  return Object.entries(alloc)
    .filter(([, c]) => c > 0)
    .map(([id, c]) => `${id}:${c}`)
    .join(",");
}

export function clampExamCountToPool(setSize: ExamQuestionSetSize, poolCap: number): number {
  return Math.min(setSize, Math.max(0, poolCap));
}

/** Start allowed when the pool can deliver at least {@link EXAM_CONDITIONS_SESSION_MIN_QUESTIONS}. */
export function examSessionMeetsMinimum(poolCap: number, effectiveCount: number): boolean {
  if (effectiveCount <= 0 || poolCap < EXAM_CONDITIONS_SESSION_MIN_QUESTIONS) {
    return false;
  }
  return effectiveCount >= EXAM_CONDITIONS_SESSION_MIN_QUESTIONS;
}

/** Evenly split `total` questions across topics (remainder to earlier slots). */
export function splitExamAllocationsEvenly(topicIds: string[], total: number): Record<string, number> {
  if (topicIds.length === 0 || total <= 0) {
    return {};
  }
  const base = Math.floor(total / topicIds.length);
  let rem = total - base * topicIds.length;
  const out: Record<string, number> = {};
  for (const id of topicIds) {
    out[id] = base + (rem > 0 ? 1 : 0);
    if (rem > 0) {
      rem -= 1;
    }
  }
  return out;
}

/**
 * @deprecated Use {@link clampExamCountToPool} with a set size of 10, 20, or 30.
 */
export function resolveExamConditionsQuestionCount(maxCount: number, requested?: number) {
  const cap = Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, Math.max(0, maxCount));
  const defaultCount = maxCount <= 10 ? maxCount : Math.min(20, maxCount);

  if (requested === undefined || requested === null || Number.isNaN(requested)) {
    return cap === 0 ? 0 : Math.min(defaultCount, cap);
  }

  const rounded = Math.round(Number(requested));
  if (!Number.isFinite(rounded)) {
    return cap === 0 ? 0 : Math.min(defaultCount, cap);
  }

  return cap === 0 ? 0 : Math.max(1, Math.min(cap, rounded));
}

export function getExamConditionsPoolStats(
  topicId: string,
  snapshot?: SharedCurriculumSnapshot | null
) {
  const bundle = getTopicContentBundle(topicId, snapshot);
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  const eligibleQuestions = getExamRawPoolForTopic(topicId, bundle.questions, snapshot);

  for (const question of eligibleQuestions) {
    const tier = inferDifficulty(question);
    if (tier === "easy") {
      easyCount += 1;
    } else if (tier === "medium") {
      mediumCount += 1;
    } else {
      hardCount += 1;
    }
  }

  const poolSize = easyCount + mediumCount + hardCount;
  const maxSessionQuestions =
    poolSize === 0 ? 0 : Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, poolSize);
  const defaultQuestionCount = resolveExamConditionsQuestionCount(poolSize);
  const eligibleForStem = eligibleQuestions;
  const pastPaperStemCountInPool = eligibleForStem.filter(
    (question) => getQuestionContentSourceKind(question.sourceId, snapshot) === "past-paper"
  ).length;
  const paperSetStemCountInPool = eligibleForStem.filter(isCuratedPaperSetSource).length;
  const examStyleStemCountInPool = pastPaperStemCountInPool + paperSetStemCountInPool;

  return {
    poolSize,
    maxSessionQuestions,
    defaultQuestionCount,
    easyCount,
    mediumCount,
    hardCount,
    pastPaperStemCountInPool,
    paperSetStemCountInPool,
    examStyleStemCountInPool,
  };
}

/** Max questions drawable from one topic for Exam Questions (by difficulty mode). */
export function getTopicExamAllocCap(
  topicId: string,
  mode: ExamConditionsDifficultyMode,
  snapshot?: SharedCurriculumSnapshot | null
): number {
  const s = getExamConditionsPoolStats(topicId, snapshot);
  switch (mode) {
    case "easy":
      return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, s.easyCount);
    case "medium":
      return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, s.mediumCount);
    case "hard":
      return Math.min(EXAM_CONDITIONS_SESSION_MAX_QUESTIONS, s.hardCount);
    default:
      return s.maxSessionQuestions;
  }
}

function buildDifficultyTargets(questionCount: number) {
  const easeBias = Math.max(0, Math.min(1, (questionCount - 10) / 10));
  const hardTarget = Math.round(questionCount * (0.55 - 0.3 * easeBias));
  const easyTarget = Math.round(questionCount * (0.1 + 0.25 * easeBias));
  const mediumTarget = Math.max(0, questionCount - hardTarget - easyTarget);

  return {
    hard: hardTarget,
    medium: mediumTarget,
    easy: easyTarget,
  };
}

function takeFromBucket<T extends { id: string }>(
  bucket: T[],
  target: number,
  selectedIds: Set<string>
) {
  const result: T[] = [];

  for (const item of bucket) {
    if (result.length >= target) {
      break;
    }

    if (selectedIds.has(item.id)) {
      continue;
    }

    selectedIds.add(item.id);
    result.push(item);
  }

  return result;
}

function orderQuestionsForSession(questions: ExamConditionsQuestion[]) {
  const easy = shuffleExamStemPriority(questions.filter((question) => question.difficulty === "easy"));
  const medium = shuffleExamStemPriority(questions.filter((question) => question.difficulty === "medium"));
  const hard = shuffleExamStemPriority(questions.filter((question) => question.difficulty === "hard"));

  return [...easy, ...medium, ...hard];
}

function pickQuestionsForEligiblePool(
  eligiblePool: ExamConditionsQuestion[],
  questionCount: number,
  difficultyMode: ExamConditionsDifficultyMode,
  preferred: ExamConditionsQuestion | null
): ExamConditionsQuestion[] {
  const count = Math.max(0, Math.min(questionCount, eligiblePool.length));
  if (count === 0) {
    return [];
  }

  const targets =
    difficultyMode === "mixed"
      ? buildDifficultyTargets(count)
      : {
          easy: difficultyMode === "easy" ? count : 0,
          medium: difficultyMode === "medium" ? count : 0,
          hard: difficultyMode === "hard" ? count : 0,
        };
  const selectedIds = new Set<string>();
  const hardBucket = shuffleExamStemPriority(eligiblePool.filter((question) => question.difficulty === "hard"));
  const mediumBucket = shuffleExamStemPriority(eligiblePool.filter((question) => question.difficulty === "medium"));
  const easyBucket = shuffleExamStemPriority(eligiblePool.filter((question) => question.difficulty === "easy"));

  const selected: ExamConditionsQuestion[] = [];
  if (preferred) {
    selectedIds.add(preferred.id);
    selected.push(preferred);
  }

  selected.push(
    ...takeFromBucket(
      hardBucket,
      Math.max(0, targets.hard - (preferred?.difficulty === "hard" ? 1 : 0)),
      selectedIds
    )
  );
  selected.push(
    ...takeFromBucket(
      mediumBucket,
      Math.max(0, targets.medium - (preferred?.difficulty === "medium" ? 1 : 0)),
      selectedIds
    )
  );
  selected.push(
    ...takeFromBucket(
      easyBucket,
      Math.max(0, targets.easy - (preferred?.difficulty === "easy" ? 1 : 0)),
      selectedIds
    )
  );

  if (selected.length < count) {
    const fallback = shuffleExamStemPriority(eligiblePool);
    selected.push(...takeFromBucket(fallback, count - selected.length, selectedIds));
  }

  const ordered = orderQuestionsForSession(selected.slice(0, count));
  if (preferred && ordered.some((question) => question.id === preferred.id)) {
    return [preferred, ...ordered.filter((question) => question.id !== preferred.id)];
  }
  return ordered;
}

function estimateMinutes(questions: ExamConditionsQuestion[]) {
  const hardCount = questions.filter((question) => question.difficulty === "hard").length;
  const mediumCount = questions.filter((question) => question.difficulty === "medium").length;
  return Math.max(
    25,
    Math.round(questions.length * 2.4 + mediumCount * 0.8 + hardCount * 1.4)
  );
}

export function generateExamConditionsSession(
  topicId: string,
  options: {
    preferredQuestionId?: string;
    snapshot?: SharedCurriculumSnapshot | null;
    /** Paper size: 10, 20, or 30 (capped by pool). Default 10. */
    setSize?: ExamQuestionSetSize;
    /** @deprecated Use setSize (10/20/30). */
    questionCount?: number;
    /** Default `mixed` uses a balanced hard/medium/easy mix; a single level only picks that tier. */
    difficultyMode?: ExamConditionsDifficultyMode;
  } = {}
): ExamConditionsSession {
  const bundle = getTopicContentBundle(topicId, options.snapshot);
  const eligibleRaw = getExamRawPoolForTopic(topicId, bundle.questions, options.snapshot);
  const isPastSource = (q: QuestionMetadata) =>
    getQuestionContentSourceKind(q.sourceId, options.snapshot) === "past-paper";
  const isPaperSetSource = (q: QuestionMetadata) => isCuratedPaperSetSource(q);
  const pastRaw = shuffleArray(eligibleRaw.filter(isPastSource));
  const paperSetRaw = shuffleArray(
    eligibleRaw.filter((q) => !isPastSource(q) && isPaperSetSource(q))
  );
  const restRaw = shuffleArray(eligibleRaw.filter((q) => !isPastSource(q) && !isPaperSetSource(q)));
  const uniqueRaw = dedupeExamEligibleQuestions(
    [...pastRaw, ...paperSetRaw, ...restRaw],
    options.snapshot
  );
  const pool = uniqueRaw.map((question) => toExamConditionsQuestion(topicId, question, options.snapshot));

  if (pool.length === 0) {
    return {
      topicId,
      questionCount: 0,
      estimatedMinutes: 0,
      questions: [],
    };
  }

  const difficultyMode: ExamConditionsDifficultyMode = options.difficultyMode ?? "mixed";
  const eligiblePool =
    difficultyMode === "mixed" ? pool : pool.filter((question) => question.difficulty === difficultyMode);

  if (eligiblePool.length === 0) {
    return {
      topicId,
      questionCount: 0,
      estimatedMinutes: 0,
      questions: [],
    };
  }

  const preferred = options.preferredQuestionId
    ? eligiblePool.find((question) => question.id === options.preferredQuestionId) ?? null
    : null;

  const setSize: ExamQuestionSetSize =
    options.setSize ??
    (() => {
      const n = options.questionCount;
      if (n === undefined || !Number.isFinite(n)) {
        return 10;
      }
      if (n <= 10) {
        return 10;
      }
      if (n <= 20) {
        return 20;
      }
      return 30;
    })();

  const targetCount = clampExamCountToPool(setSize, eligiblePool.length);
  const finalQuestions = dedupeExamConditionsQuestionList(
    pickQuestionsForEligiblePool(eligiblePool, targetCount, difficultyMode, preferred)
  );
  const topicInfo = getTopicById(topicId);
  const releasedPastPaperStemCount = finalQuestions.filter((q) => q.stemOrigin === "past-paper").length;
  const examStyleStemCount = finalQuestions.filter((q) => q.stemOrigin !== "practice").length;

  return {
    topicId,
    questionCount: finalQuestions.length,
    estimatedMinutes: estimateMinutes(finalQuestions),
    questions: finalQuestions,
    releasedPastPaperStemCount,
    examStyleStemCount,
    pinnedQuestionId: preferred?.id,
    plannedQuestionCount: setSize,
    topicMix: [
      {
        topicId,
        label: topicInfo?.label ?? topicId,
        count: finalQuestions.length,
      },
    ],
  };
}

export interface ExamTopicAllocationInput {
  topicId: string;
  count: number;
}

/** Build one session from explicit per-topic counts (sum must equal `setSize`). Questions are shuffled together. */
export function generateMultiTopicExamSession(
  allocations: ExamTopicAllocationInput[],
  options: {
    /** Requested paper length (10/20/30); may exceed what the pool delivers. */
    setSize: ExamQuestionSetSize;
    difficultyMode?: ExamConditionsDifficultyMode;
    snapshot?: SharedCurriculumSnapshot | null;
    preferredQuestionId?: string;
  }
): ExamConditionsSession {
  const difficultyMode: ExamConditionsDifficultyMode = options.difficultyMode ?? "mixed";
  const sum = allocations.reduce((s, a) => s + Math.max(0, a.count), 0);
  if (sum === 0) {
    return {
      topicId: allocations[0]?.topicId ?? "",
      questionCount: 0,
      estimatedMinutes: 0,
      questions: [],
    };
  }

  const collected: ExamConditionsQuestion[] = [];
  const topicMix: Array<{ topicId: string; label: string; count: number }> = [];

  for (const { topicId, count } of allocations) {
    if (count <= 0) {
      continue;
    }
    const bundle = getTopicContentBundle(topicId, options.snapshot);
    const eligibleRaw = getExamRawPoolForTopic(topicId, bundle.questions, options.snapshot);
    const isPastSource = (q: QuestionMetadata) =>
      getQuestionContentSourceKind(q.sourceId, options.snapshot) === "past-paper";
    const isPaperSetSource = (q: QuestionMetadata) => isCuratedPaperSetSource(q);
    const pastRaw = shuffleArray(eligibleRaw.filter(isPastSource));
    const paperSetRaw = shuffleArray(
      eligibleRaw.filter((q) => !isPastSource(q) && isPaperSetSource(q))
    );
    const restRaw = shuffleArray(eligibleRaw.filter((q) => !isPastSource(q) && !isPaperSetSource(q)));
    const uniqueRaw = dedupeExamEligibleQuestions(
      [...pastRaw, ...paperSetRaw, ...restRaw],
      options.snapshot
    );
    const pool = uniqueRaw.map((question) => toExamConditionsQuestion(topicId, question, options.snapshot));
    const eligiblePool =
      difficultyMode === "mixed" ? pool : pool.filter((question) => question.difficulty === difficultyMode);

    const preferred =
      options.preferredQuestionId &&
      eligiblePool.some((q) => q.id === options.preferredQuestionId) &&
      eligiblePool.find((q) => q.id === options.preferredQuestionId)
        ? eligiblePool.find((q) => q.id === options.preferredQuestionId)!
        : null;

    const picked = pickQuestionsForEligiblePool(
      eligiblePool,
      Math.min(count, eligiblePool.length),
      difficultyMode,
      preferred
    );
    collected.push(...picked);
    const topicInfo = getTopicById(topicId);
    topicMix.push({ topicId, label: topicInfo?.label ?? topicId, count: picked.length });
  }

  const finalQuestions = dedupeExamConditionsQuestionList(shuffleArray(collected));
  const anchorTopicId = allocations.find((a) => a.count > 0)?.topicId ?? "";
  const releasedPastPaperStemCount = finalQuestions.filter((q) => q.stemOrigin === "past-paper").length;
  const examStyleStemCount = finalQuestions.filter((q) => q.stemOrigin !== "practice").length;

  return {
    topicId: anchorTopicId,
    questionCount: finalQuestions.length,
    estimatedMinutes: estimateMinutes(finalQuestions),
    questions: finalQuestions,
    releasedPastPaperStemCount,
    examStyleStemCount,
    plannedQuestionCount: options.setSize,
    topicMix,
  };
}

function extractMarkSchemeSummaryCues(summary: string): string[] {
  const raw = summary.replace(/\s+/g, " ").trim();
  if (!raw) {
    return [];
  }
  const segments = raw.split(/\s*\|\s*/);
  const out: string[] = [];
  for (const segment of segments) {
    const t = segment.trim();
    if (t.length >= 14) {
      out.push(t);
    }
    const colon = t.indexOf(":");
    if (colon > 0 && colon < t.length - 4) {
      const after = t.slice(colon + 1).trim();
      if (after.length >= 10) {
        out.push(after);
      }
    }
  }
  return uniqueStrings(out).slice(0, 12);
}

function buildEvaluationQuestion(question: ExamConditionsQuestion) {
  const paper =
    question.paper === "Paper 1" || question.paper === "Paper 2"
      ? (question.paper as PracticePaper)
      : undefined;

  const summaryCues = extractMarkSchemeSummaryCues(question.markSchemeSummary);
  const acceptableAnswers = uniqueStrings([...question.acceptableAnswers, ...summaryCues]);

  return {
    id: `exam-session-${question.id}`,
    topicId: question.topicId,
    type: "short-answer" as const,
    question: question.prompt,
    correctAnswer: acceptableAnswers[0] ?? question.expectation,
    acceptableAnswers,
    explanation: question.expectation,
    difficulty: question.difficulty,
    sourceLabel: question.sourceLabel,
    paper,
    evaluationProfile: question.evaluationProfile,
  };
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

export function evaluateExamConditionsQuestion(
  question: ExamConditionsQuestion,
  answer: string
) {
  if (!answer.trim()) {
    const maxScore = question.marks;
    return {
      score: 0,
      maxScore,
      scorePercent: 0,
      evaluation: {
        isCorrect: false,
        matchedCue: null,
        confidence: 0,
        score: 0,
        maxScore,
        verdict: "not-quite" as const,
        verdictLabel: "No answer",
        matchedSlots: [],
        partialSlots: [],
        missingSlots: ["No response submitted"],
        feedback: "No answer was submitted for this question.",
        slotBreakdown: [],
      },
    };
  }

  const rawEvaluation = evaluatePracticeShortAnswer(answer, buildEvaluationQuestion(question));
  const maxScore = Math.max(1, question.marks);
  const scaledScore =
    rawEvaluation.maxScore > 0
      ? roundToTenth((rawEvaluation.score / rawEvaluation.maxScore) * maxScore)
      : 0;
  const scorePercent = Math.round((scaledScore / maxScore) * 100);

  return {
    score: scaledScore,
    maxScore,
    scorePercent,
    evaluation: {
      ...rawEvaluation,
      score: scaledScore,
      maxScore,
    },
  };
}

export function evaluateExamConditionsSession(
  questions: ExamConditionsQuestion[],
  answers: Record<string, string>
): ExamConditionsSessionResult {
  const reviews = questions.map((question) => {
    const answer = answers[question.id] ?? "";
    const evaluation = evaluateExamConditionsQuestion(question, answer);

    const row: ExamConditionsReview = {
      question,
      answer,
      evaluation: evaluation.evaluation,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      scorePercent: evaluation.scorePercent,
    };

    if (answer.trim()) {
      row.geminiMarking = buildLocalExaminerMarking(evaluation.evaluation, evaluation.maxScore);
    }

    return row;
  });

  const totalScore = roundToTenth(reviews.reduce((sum, review) => sum + review.score, 0));
  const totalMaxScore = reviews.reduce((sum, review) => sum + review.maxScore, 0);
  const answeredCount = reviews.filter((review) => review.answer.trim().length > 0).length;
  const scorePercent = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  return {
    reviews,
    totalScore,
    totalMaxScore,
    scorePercent,
    answeredCount,
    markingProvider: "local",
    overallBand: bandFromPercent(scorePercent),
    overallSummary: localOverallSummary(scorePercent, answeredCount, questions.length),
    examMarkingMeta: { usedGemini: false },
    sessionClosingFeedback: buildLocalSessionClosingFeedback(reviews),
  };
}

function bandFromPercent(pct: number): string {
  if (pct >= 75) return "Strong";
  if (pct >= 55) return "Merit";
  if (pct >= 35) return "Pass";
  return "Below";
}

function localOverallSummary(pct: number, answered: number, total: number): string {
  return `${pct}% · ${answered}/${total} answered · cue + rubric summary marker.`;
}

/** Fallback when the session-level AI closing call fails or is off. */
export function buildLocalSessionClosingFeedback(reviews: ExamConditionsReview[]): {
  whatWentWell: string;
  targetsToImprove: string;
} {
  const answered = reviews.filter((r) => r.answer.trim().length > 0);
  const strong = answered.filter((r) => r.scorePercent >= 72);
  const weak = reviews.filter((r) => !r.answer.trim() || r.scorePercent < 45);

  const whatWentWell =
    strong.length >= 2
      ? `You showed solid understanding on ${strong.length} questions — keep linking those ideas to the command words.`
      : strong.length === 1
        ? "There is clear strength in at least one answer; build the same depth across the rest of the paper."
        : "You attempted the paper; next time foreground precise, scheme-linked points in every response.";

  const targetsToImprove =
    weak.length >= 3
      ? `${weak.length} responses need more detail or were left thin — aim for one concrete point per mark and answer every part of the prompt.`
      : weak.length > 0
        ? "Tighten weaker answers with specific vocabulary from the mark scheme and short, relevant examples."
        : "Add one extra developed idea on higher-mark questions to push into the next band.";

  return { whatWentWell, targetsToImprove };
}

function buildLocalExaminerMarking(
  evaluation: PracticeShortAnswerEvaluation,
  scaledMaxScore: number
): NonNullable<ExamConditionsReview["geminiMarking"]> {
  const ratio = scaledMaxScore > 0 ? evaluation.score / scaledMaxScore : 0;
  const level: ExamGeminiItemLevel =
    ratio >= 0.85 ? "detailed" : ratio >= 0.58 ? "clear" : ratio >= 0.28 ? "basic" : "none";

  const fromSlots = evaluation.slotBreakdown
    .filter((slot) => slot.matchedEvidence.length > 0)
    .flatMap((slot) => slot.matchedEvidence.map((c) => c.slice(0, 140)));

  const evidence = uniqueStrings([
    ...evaluation.matchedSlots.map((s) => s.slice(0, 140)),
    ...fromSlots,
  ]).slice(0, 3);

  return {
    why: evaluation.feedback.replace(/\s+/g, " ").trim().slice(0, 520),
    evidence,
    level,
    lowConfidence: false,
  };
}

function verdictFromRatio(ratio: number): {
  verdict: PracticeShortAnswerEvaluation["verdict"];
  verdictLabel: string;
} {
  if (ratio >= 0.82) {
    return { verdict: "strong", verdictLabel: "Strong" };
  }
  if (ratio >= 0.55) {
    return { verdict: "mostly-correct", verdictLabel: "Mostly there" };
  }
  if (ratio >= 0.28) {
    return { verdict: "partial", verdictLabel: "Partial" };
  }
  return { verdict: "not-quite", verdictLabel: "Needs work" };
}

function clampMarksAwarded(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return roundToTenth(Math.max(0, Math.min(max, value)));
}

export function mergeGeminiExamMarking(
  questions: ExamConditionsQuestion[],
  answers: Record<string, string>,
  gemini: GeminiExamMarkResponse
): ExamConditionsSessionResult {
  const completeItems = ensureCompleteGeminiItems(gemini, questions, answers, evaluateExamConditionsQuestion);
  const byId = new Map(completeItems.map((item) => [item.id, item]));

  const reviews: ExamConditionsReview[] = questions.map((question) => {
    const answer = answers[question.id] ?? "";
    const maxScore = Math.max(1, question.marks);

    if (!answer.trim()) {
      const empty = evaluateExamConditionsQuestion(question, answer);
      return {
        question,
        answer,
        evaluation: empty.evaluation,
        score: empty.score,
        maxScore: empty.maxScore,
        scorePercent: empty.scorePercent,
      };
    }

    const g = byId.get(question.id);
    if (!g) {
      const local = evaluateExamConditionsQuestion(question, answer);
      return {
        question,
        answer,
        evaluation: local.evaluation,
        score: local.score,
        maxScore: local.maxScore,
        scorePercent: local.scorePercent,
      };
    }

    const localSnapshot = evaluateExamConditionsQuestion(question, answer);
    const rawGeminiMark = typeof g.m === "number" ? g.m : Number(g.m) || 0;
    const score = clampMarksAwarded(rawGeminiMark, maxScore);
    const ratio = score / maxScore;
    const { verdict, verdictLabel } = verdictFromRatio(ratio);
    const hit = (g.hit ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 5);
    const miss = (g.miss ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 5);
    const fb = (g.fb ?? "").replace(/\s+/g, " ").trim().slice(0, 520);
    const why = (g.why ?? "").replace(/\s+/g, " ").trim().slice(0, 520);
    const evidence = (g.evidence ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 3);
    const level = parseItemLevel(g.level);

    const evaluation: PracticeShortAnswerEvaluation = {
      isCorrect: ratio >= 0.85,
      matchedCue: hit[0] ?? null,
      confidence: Math.round(ratio * 100),
      score,
      maxScore,
      verdict,
      verdictLabel,
      matchedSlots: hit,
      partialSlots: [],
      missingSlots: miss,
      feedback: fb.length > 0 ? fb : why.length > 0 ? why : "Marked against the supplied scheme.",
      slotBreakdown: [],
    };

    const lowConfidence = geminiVsLocalLowConfidence(score, localSnapshot.score, maxScore);

    return {
      question,
      answer,
      evaluation,
      score,
      maxScore,
      scorePercent: Math.round((score / maxScore) * 100),
      geminiMarking: {
        why: why.length > 0 ? why : fb,
        evidence,
        level,
        lowConfidence,
      },
    };
  });

  const totalScore = roundToTenth(reviews.reduce((sum, review) => sum + review.score, 0));
  const totalMaxScore = reviews.reduce((sum, review) => sum + review.maxScore, 0);
  const answeredCount = reviews.filter((review) => review.answer.trim().length > 0).length;
  const scorePercent = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  const bandDecision = reconcileOverallBand(gemini.band ?? "", scorePercent, 1);
  const examinerNote = (gemini.examinerNote ?? "").replace(/\s+/g, " ").trim().slice(0, 280);
  const ww = (gemini.whatWentWell ?? "").replace(/\s+/g, " ").trim().slice(0, 620);
  const ti = (gemini.targetsToImprove ?? "").replace(/\s+/g, " ").trim().slice(0, 620);
  const localClosing = buildLocalSessionClosingFeedback(reviews);

  const walkMap = new Map((gemini.walkthrough ?? []).map((w) => [w.id, w]));
  const examinerWalkthrough: ExaminerWalkthroughBeat[] = questions.map((q, idx) => {
    const w = walkMap.get(q.id);
    const rev = reviews.find((r) => r.question.id === q.id);
    if (w) {
      const answerTrimmed = (answers[q.id] ?? "").trim();
      const hl = mergeHlQuotesIntoHighlightSpans(answerTrimmed, w.hl, w.hlQuotes);
      return {
        id: q.id,
        line: w.line.replace(/\s+/g, " ").trim().slice(0, 220),
        note: w.note.replace(/\s+/g, " ").trim().slice(0, 560),
        hl,
        hlQuotes: w.hlQuotes,
        credit: w.credit,
        improve: w.improve,
      };
    }
    const fb = rev?.evaluation.feedback ?? rev?.geminiMarking?.why ?? "";
    return {
      id: q.id,
      line: `Question ${idx + 1}.`,
      note: (fb || "See the mark breakdown below.").replace(/\s+/g, " ").trim().slice(0, 560),
    };
  });

  const examinerOpeningRaw = (gemini.opening ?? "").replace(/\s+/g, " ").trim();
  const examinerOpening =
    examinerOpeningRaw.length > 0
      ? examinerOpeningRaw.slice(0, 420)
      : "I've read your whole paper — let's walk through what you wrote, question by question.";

  return {
    reviews,
    totalScore,
    totalMaxScore,
    scorePercent,
    answeredCount,
    markingProvider: "gemini",
    overallBand: bandDecision.displayBand,
    bandOverriddenToMatchMarks: bandDecision.overridden,
    overallSummary: (gemini.oneLiner ?? localOverallSummary(scorePercent, answeredCount, questions.length))
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320),
    examinerNote: examinerNote.length > 0 ? examinerNote : undefined,
    examinerOpening,
    examinerWalkthrough,
    examMarkingMeta: { usedGemini: true },
    sessionClosingFeedback: {
      whatWentWell: ww.length > 0 ? ww : localClosing.whatWentWell,
      targetsToImprove: ti.length > 0 ? ti : localClosing.targetsToImprove,
    },
  };
}
