import type { QuestionMetadata } from "@/data/curriculum";
import { getMarkSchemeConceptsForQuestion, getTopicContentBundle } from "@/lib/content";
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
}

export type ExamGeminiItemLevel = "none" | "basic" | "clear" | "detailed";

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

export interface GeminiExamMarkResponse {
  band: string;
  oneLiner: string;
  items: GeminiExamMarkItem[];
  examinerNote?: string;
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

function pickQuestionCount(maxCount: number) {
  if (maxCount <= 10) {
    return maxCount;
  }

  const upperBound = Math.min(20, maxCount);
  return 10 + Math.floor(Math.random() * (upperBound - 10 + 1));
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

  const preferred = options.preferredQuestionId
    ? pool.find((question) => question.id === options.preferredQuestionId) ?? null
    : null;
  const questionCount = pickQuestionCount(pool.length);
  const targets = buildDifficultyTargets(questionCount);
  const selectedIds = new Set<string>();
  const hardBucket = shuffleArray(pool.filter((question) => question.difficulty === "hard"));
  const mediumBucket = shuffleArray(pool.filter((question) => question.difficulty === "medium"));
  const easyBucket = shuffleArray(pool.filter((question) => question.difficulty === "easy"));

  const selected: ExamConditionsQuestion[] = [];
  if (preferred) {
    selectedIds.add(preferred.id);
    selected.push(preferred);
  }

  selected.push(...takeFromBucket(hardBucket, Math.max(0, targets.hard - (preferred?.difficulty === "hard" ? 1 : 0)), selectedIds));
  selected.push(...takeFromBucket(mediumBucket, Math.max(0, targets.medium - (preferred?.difficulty === "medium" ? 1 : 0)), selectedIds));
  selected.push(...takeFromBucket(easyBucket, Math.max(0, targets.easy - (preferred?.difficulty === "easy" ? 1 : 0)), selectedIds));

  if (selected.length < questionCount) {
    const fallback = shuffleArray(pool);
    selected.push(...takeFromBucket(fallback, questionCount - selected.length, selectedIds));
  }

  const ordered = orderQuestionsForSession(selected.slice(0, questionCount));
  const finalQuestions =
    preferred && ordered.some((question) => question.id === preferred.id)
      ? [preferred, ...ordered.filter((question) => question.id !== preferred.id)]
      : ordered;

  return {
    topicId,
    questionCount: finalQuestions.length,
    estimatedMinutes: estimateMinutes(finalQuestions),
    questions: finalQuestions,
    pinnedQuestionId: preferred?.id,
  };
}

function buildEvaluationQuestion(question: ExamConditionsQuestion) {
  const paper =
    question.paper === "Paper 1" || question.paper === "Paper 2"
      ? (question.paper as PracticePaper)
      : undefined;

  return {
    id: `exam-session-${question.id}`,
    topicId: question.topicId,
    type: "short-answer" as const,
    question: question.prompt,
    correctAnswer: question.acceptableAnswers[0] ?? question.expectation,
    acceptableAnswers: question.acceptableAnswers,
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

    return {
      question,
      answer,
      evaluation: evaluation.evaluation,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      scorePercent: evaluation.scorePercent,
    };
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
  };
}

function bandFromPercent(pct: number): string {
  if (pct >= 75) return "Strong";
  if (pct >= 55) return "Merit";
  if (pct >= 35) return "Pass";
  return "Build up";
}

function localOverallSummary(pct: number, answered: number, total: number): string {
  return `${pct}% · ${answered}/${total} attempted · local cue-based marker.`;
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
  };
}
