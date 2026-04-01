import type { CommandWordId } from "@/lib/command-words";
import { buildStructuredFeedback } from "@/lib/marking/structured-feedback";
import type {
  CommunityContentEvaluation,
  MisconceptionEvaluation,
  RevisionAnswerEvaluation,
  RevisionConceptRule,
} from "./types";

export function buildRevisionFeedback(
  answerTokenCount: number,
  conceptRules: RevisionConceptRule[],
  partialConcepts: string[],
  evaluation: Pick<
    RevisionAnswerEvaluation,
    "score" | "maxScore" | "matchedConcepts" | "missingConcepts"
  >,
  misconceptions: MisconceptionEvaluation[],
  commandWordId?: CommandWordId | null
): string {
  const matchedConceptPraise = conceptRules
    .filter((rule) => evaluation.matchedConcepts.includes(rule.label))
    .slice(0, 2)
    .map((rule) => rule.feedback);

  return buildStructuredFeedback({
    answerTokenCount,
    score: evaluation.score,
    maxScore: evaluation.maxScore,
    matchedLabels: [],
    partialLabels: partialConcepts,
    missingLabels: evaluation.missingConcepts,
    misconceptions,
    matchedConceptPraise,
    commandWordId: commandWordId ?? null,
  });
}

export function buildCommunityReasons(
  evaluation: CommunityContentEvaluation
): string[] {
  const reasons = [...evaluation.reasons];

  if (!reasons.length && evaluation.qualityScore >= 75 && evaluation.relevanceScore >= 45) {
    reasons.push("The content is specific enough to be useful and stays reasonably aligned with the topic.");
  }

  if (!reasons.length && evaluation.qualityScore < 45) {
    reasons.push("The content is too thin to add reliable learning value.");
  }

  if (!reasons.length && evaluation.relevanceScore < 45) {
    reasons.push("The content needs clearer topic-specific language to feel properly aligned.");
  }

  if (!reasons.length) {
    reasons.push("No major moderation risk was detected, but the content could still be made more specific.");
  }

  return reasons;
}
