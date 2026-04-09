import type { QuestionMetadata } from "@/data/curriculum";
import { getMarkSchemeConceptsForQuestion, getTopicContentBundle } from "@/lib/content";
import { getTopicById } from "@/lib/types";
import {
  evaluatePracticeShortAnswer,
  type PracticeShortAnswerEvaluation,
} from "@/lib/practice-evaluator";
import { extractCommandWord } from "@/lib/command-words";
import type { SharedCurriculumSnapshot } from "@/lib/shared-curriculum";
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

export interface ExamConditionsQuestion {
  id: string;
  topicId: string;
  title: string;
  prompt: string;
  sourceLabel: string;
  marks: number;
  questionType: QuestionMetadata["questionType"];
  difficulty: ExamConditionsDifficulty;
  paper?: string;
  expectation: string;
  acceptableAnswers: string[];
  evaluationProfile?: QuestionMetadata["evaluationProfile"];
  /** Condensed mark-scheme cues for end-of-session AI marking (single request). */
  markSchemeSummary: string;
}

export interface ExamConditionsSession {
  topicId: string;
  questionCount: number;
  estimatedMinutes: number;
  questions: ExamConditionsQuestion[];
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

/** One step of the examiner “walking through” the paper (same order as questions). */
export interface ExaminerWalkthroughBeat {
  id: string;
  /** Short lead-in, e.g. “On this one you…” */
  line: string;
  /** Voice note on that answer (2–3 sentences). */
  note: string;
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

function toExamConditionsQuestion(
  topicId: string,
  question: QuestionMetadata,
  snapshot?: SharedCurriculumSnapshot | null
): ExamConditionsQuestion {
  const acceptableAnswers = extractCues(question, snapshot);

  return {
    id: question.id,
    topicId,
    title: question.title,
    prompt: question.practicePrompt,
    sourceLabel: question.sourceLabel,
    marks: question.marks ?? 4,
    questionType: question.questionType,
    difficulty: inferDifficulty(question),
    paper: question.paper,
    expectation: question.expectation,
    acceptableAnswers,
    evaluationProfile: question.evaluationProfile,
    markSchemeSummary: buildMarkSchemeSummary(question, snapshot),
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

  for (const question of bundle.questions) {
    if (question.questionType === "question-bank-section") {
      continue;
    }
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

  return {
    poolSize,
    maxSessionQuestions,
    defaultQuestionCount,
    easyCount,
    mediumCount,
    hardCount,
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
  const easy = shuffleArray(questions.filter((question) => question.difficulty === "easy"));
  const medium = shuffleArray(questions.filter((question) => question.difficulty === "medium"));
  const hard = shuffleArray(questions.filter((question) => question.difficulty === "hard"));

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
  const hardBucket = shuffleArray(eligiblePool.filter((question) => question.difficulty === "hard"));
  const mediumBucket = shuffleArray(eligiblePool.filter((question) => question.difficulty === "medium"));
  const easyBucket = shuffleArray(eligiblePool.filter((question) => question.difficulty === "easy"));

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
    const fallback = shuffleArray(eligiblePool);
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
  const pool = shuffleArray(
    bundle.questions
      .filter((question) => question.questionType !== "question-bank-section")
      .map((question) => toExamConditionsQuestion(topicId, question, options.snapshot))
  );

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
  const finalQuestions = pickQuestionsForEligiblePool(eligiblePool, targetCount, difficultyMode, preferred);
  const topicInfo = getTopicById(topicId);

  return {
    topicId,
    questionCount: finalQuestions.length,
    estimatedMinutes: estimateMinutes(finalQuestions),
    questions: finalQuestions,
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
    const pool = shuffleArray(
      bundle.questions
        .filter((question) => question.questionType !== "question-bank-section")
        .map((question) => toExamConditionsQuestion(topicId, question, options.snapshot))
    );
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

  const finalQuestions = shuffleArray(collected);
  const anchorTopicId = allocations.find((a) => a.count > 0)?.topicId ?? "";

  return {
    topicId: anchorTopicId,
    questionCount: finalQuestions.length,
    estimatedMinutes: estimateMinutes(finalQuestions),
    questions: finalQuestions,
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
      missingSlots: miss.length > 0 ? miss : ["Gap vs mark scheme"],
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
      return {
        id: q.id,
        line: w.line.replace(/\s+/g, " ").trim().slice(0, 220),
        note: w.note.replace(/\s+/g, " ").trim().slice(0, 560),
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
