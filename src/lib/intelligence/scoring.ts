import { extractCommandWord } from "@/lib/command-words";
import { evaluateConcept, evaluateMisconception } from "./concepts";
import { buildRevisionFeedback } from "./feedback";
import { normalizeText } from "./normalize";
import type {
  RevisionAnswerEvaluation,
  RevisionQuestionSchema,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function computeRevisionConfidence(
  answerTokenCount: number,
  conceptCoverage: number,
  misconceptionCount: number
): number {
  const lengthSignal = Math.min(answerTokenCount / 24, 1);
  const misconceptionPenalty = misconceptionCount ? misconceptionCount * 0.08 : 0;
  const confidence = 0.35 + conceptCoverage * 0.45 + lengthSignal * 0.2 - misconceptionPenalty;

  return roundToTenth(clamp(confidence, 0.1, 0.98));
}

export function evaluateRevisionAnswerWithSchema(
  schema: RevisionQuestionSchema,
  answer: string
): RevisionAnswerEvaluation {
  const normalized = normalizeText(answer);
  const conceptBreakdown = schema.concepts.map((rule) => evaluateConcept(normalized, rule));
  const misconceptionBreakdown = schema.misconceptions
    .map((rule) => evaluateMisconception(normalized, rule))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const positiveScore = conceptBreakdown.reduce((total, concept) => total + concept.scoreAwarded, 0);
  const penalties = misconceptionBreakdown.reduce(
    (total, misconception) => total + misconception.penaltyApplied,
    0
  );
  const score = clamp(roundToTenth(positiveScore - penalties), 0, schema.maxScore);
  const matchedConcepts = conceptBreakdown
    .filter((concept) => concept.coverage > 0)
    .map((concept) => concept.label);
  const partialConcepts = conceptBreakdown
    .filter((concept) => concept.coverage > 0 && concept.coverage < 1)
    .map((concept) => concept.label);
  const missingConcepts = conceptBreakdown
    .filter((concept) => concept.coverage === 0)
    .map((concept) => concept.label);
  const misconceptions = misconceptionBreakdown.map((misconception) => misconception.label);
  const conceptCoverage =
    conceptBreakdown.length > 0
      ? conceptBreakdown.reduce((total, concept) => total + concept.coverage, 0) / conceptBreakdown.length
      : 0;
  const confidence = computeRevisionConfidence(
    normalized.tokens.length,
    conceptCoverage,
    misconceptionBreakdown.length
  );

  return {
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "revision-answer",
    questionId: schema.id,
    topicId: schema.topicId,
    score,
    maxScore: schema.maxScore,
    matchedConcepts,
    missingConcepts,
    misconceptions,
    confidence,
    feedback: buildRevisionFeedback(
      normalized.tokens.length,
      schema.concepts,
      partialConcepts,
      {
        score,
        maxScore: schema.maxScore,
        matchedConcepts,
        missingConcepts,
      },
      misconceptionBreakdown,
      extractCommandWord(schema.prompt)?.id ?? null
    ),
    conceptBreakdown,
    misconceptionBreakdown,
  };
}
