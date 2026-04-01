import { TOPICS, TOPIC_TREES } from "@/lib/types";
import { buildCommunityReasons } from "./feedback";
import { normalizeText, normalizeString, tokenizeNormalized } from "./normalize";
import {
  EXPLANATION_MARKERS,
  LOW_VALUE_PHRASES,
  MISLEADING_SIGNAL_PHRASES,
  UNCIVIL_PHRASES,
} from "./rules/community";
import type { CommunityContentEvaluation, CommunityEvaluationInput } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function scoreForLength(tokenCount: number): number {
  if (tokenCount >= 45) {
    return 24;
  }

  if (tokenCount >= 25) {
    return 18;
  }

  if (tokenCount >= 12) {
    return 12;
  }

  if (tokenCount >= 6) {
    return 6;
  }

  return 0;
}

function containsWholePhrase(normalized: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`);

  return pattern.test(normalized);
}

function getTopicVocabulary(topicId?: string): string[] {
  if (!topicId) {
    return [];
  }

  const topic = TOPICS.find((item) => item.id === topicId);
  const tree = TOPIC_TREES.find((item) => item.topicId === topicId);

  return [
    ...(topic ? tokenizeNormalized(normalizeString(topic.label)) : []),
    ...(tree?.subtopics.flatMap((subtopic) =>
      subtopic.keywords.flatMap((keyword) => tokenizeNormalized(normalizeString(keyword)))
    ) ?? []),
    ...(tree?.subtopics.flatMap((subtopic) => tokenizeNormalized(normalizeString(subtopic.label))) ?? []),
  ].filter((term) => term.length >= 3 || ["ai", "vm", "vr", "ar"].includes(term));
}

function calculateRelevanceScore(contentTokens: string[], topicId?: string): number {
  const vocabulary = getTopicVocabulary(topicId);

  if (!vocabulary.length) {
    return contentTokens.length >= 8 ? 60 : 35;
  }

  const tokenSet = new Set(contentTokens);
  const hits = vocabulary.filter((term) => tokenSet.has(term));

  return clamp((hits.length / 4) * 100, 10, 100);
}

function calculateEducationalSignal(normalized: string, tokenCount: number): number {
  const explanationHits = EXPLANATION_MARKERS.filter((marker) => normalized.includes(marker)).length;
  const structureBonus = /(:|first|second|finally)/.test(normalized) ? 6 : 0;
  const base = Math.min(tokenCount / 3, 14);

  return clamp(base + explanationHits * 6 + structureBonus, 0, 30);
}

function calculateRepetitionPenalty(tokens: string[]): number {
  if (tokens.length < 6) {
    return 0;
  }

  const uniqueRatio = new Set(tokens).size / tokens.length;

  if (uniqueRatio < 0.4) {
    return 18;
  }

  if (uniqueRatio < 0.55) {
    return 10;
  }

  return 0;
}

export function evaluateCommunityContent(
  input: CommunityEvaluationInput
): CommunityContentEvaluation {
  const normalized = normalizeText(input.content);
  const tokenCount = normalized.tokens.length;
  const flags: string[] = [];
  const reasons: string[] = [];

  const lengthScore = scoreForLength(tokenCount);
  const educationalSignalScore = calculateEducationalSignal(normalized.normalized, tokenCount);
  const relevanceScore = calculateRelevanceScore(normalized.tokens, input.topicId);
  const repetitionPenalty = calculateRepetitionPenalty(normalized.tokens);

  let civilityPenalty = 0;
  let lowValuePenalty = 0;
  let misleadingPenalty = 0;

  for (const phrase of UNCIVIL_PHRASES) {
    if (containsWholePhrase(normalized.normalized, phrase)) {
      civilityPenalty = 30;
      flags.push("civility-risk");
      reasons.push("The content includes hostile or disrespectful language.");
      break;
    }
  }

  for (const phrase of LOW_VALUE_PHRASES) {
    if (containsWholePhrase(normalized.normalized, phrase)) {
      lowValuePenalty = 18;
      flags.push("low-value");
      reasons.push("The content does not add much educational value.");
      break;
    }
  }

  for (const phrase of MISLEADING_SIGNAL_PHRASES) {
    if (containsWholePhrase(normalized.normalized, phrase)) {
      misleadingPenalty = 16;
      flags.push("overconfident-claim");
      reasons.push("The content makes a high-confidence claim without enough support.");
      break;
    }
  }

  if (tokenCount < 5) {
    flags.push("too-short");
    reasons.push("The content is too short to be reliably useful.");
  }

  if (repetitionPenalty >= 10) {
    flags.push("repetitive");
    reasons.push("The content repeats itself instead of adding new detail.");
  }

  if (relevanceScore < 40 && input.topicId) {
    flags.push("off-topic");
    reasons.push("The content has weak overlap with the topic vocabulary.");
  }

  const qualityScore = clamp(
    25 + lengthScore + educationalSignalScore + relevanceScore * 0.2
      - civilityPenalty
      - repetitionPenalty
      - lowValuePenalty
      - misleadingPenalty,
    0,
    100
  );

  let suggestedState: CommunityContentEvaluation["suggestedState"] = "allow";

  if (flags.includes("civility-risk") || flags.includes("overconfident-claim")) {
    suggestedState = "review";
  } else if (qualityScore < 45 || relevanceScore < 35) {
    suggestedState = "downrank";
  }

  const evaluation: CommunityContentEvaluation = {
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "community-content",
    topicId: input.topicId,
    contentType: input.contentType ?? "reply",
    qualityScore: Math.round(qualityScore),
    relevanceScore: Math.round(relevanceScore),
    flags,
    reasons,
    suggestedState,
    signalBreakdown: {
      lengthScore,
      educationalSignalScore,
      relevanceSignalScore: Math.round(relevanceScore),
      civilityPenalty,
      repetitionPenalty,
      lowValuePenalty,
      misleadingPenalty,
    },
  };

  evaluation.reasons = buildCommunityReasons(evaluation);

  return evaluation;
}
