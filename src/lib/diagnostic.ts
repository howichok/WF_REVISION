import { isNegated } from "./intelligence/context";
import { findPhraseEvidence } from "./intelligence/fuzzy";
import { normalizeString, normalizeText } from "./intelligence/normalize";
import { REVISION_QUESTION_SCHEMAS } from "./intelligence/rules/revision";
import { evaluateRevisionAnswerWithSchema } from "./intelligence/scoring";
import type { RevisionQuestionSchema } from "./intelligence/types";
import { getRecommendedMaterialCards } from "./content";
import {
  TOPICS,
  TOPIC_TREES,
  getTopicById,
  getTopicLabel,
  type DiagnosticFollowUpEntry,
  type DiagnosticFollowUpReason,
  type DiagnosticMisconceptionFinding,
  type DiagnosticPointAssessment,
  type DiagnosticPointStatus,
  type DiagnosticResult,
  type TopicDiagnosticReport,
  type TopicId,
  type TopicScore,
} from "./types";

type DiagnosticTopicMeta = (typeof TOPICS)[number];

interface DiagnosticPhraseGroup {
  label: string;
  phrases: string[];
}

interface DiagnosticMisconceptionSignal {
  id: string;
  label: string;
  explanation: string;
  groups: DiagnosticPhraseGroup[];
}

interface DiagnosticCurriculumPointDefinition {
  id: string;
  label: string;
  keyTerms: string[];
  conceptGroups: DiagnosticPhraseGroup[];
  prompt?: string;
  schema?: RevisionQuestionSchema;
  misconceptions: DiagnosticMisconceptionSignal[];
}

interface DiagnosticTopicDefinition {
  topicId: TopicId;
  label: string;
  icon: string;
  description: string;
  points: DiagnosticCurriculumPointDefinition[];
}

export interface DiagnosticFollowUpQuestion {
  id: string;
  targetedPointId: string;
  question: string;
  reason: DiagnosticFollowUpReason;
}

export interface TopicDiagnosticSessionAnalysis {
  topic: DiagnosticTopicDefinition;
  report: TopicDiagnosticReport;
  nextFollowUp: DiagnosticFollowUpQuestion | null;
}

interface TopicDiagnosticSessionInput {
  topicId: string;
  freeformResponse: string;
  followUps?: DiagnosticFollowUpEntry[];
}

const MAX_FOLLOW_UPS = 3;

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

const DIAGNOSTIC_TOPICS = TOPICS.filter(
  (topic) => topic.id !== "esp"
) as DiagnosticTopicMeta[];

const REVISION_SCHEMA_BY_SUBTOPIC = new Map(
  REVISION_QUESTION_SCHEMAS.filter((schema) => schema.subtopicId).map((schema) => [
    schema.subtopicId as string,
    schema,
  ])
);

const DIAGNOSTIC_TOPIC_DEFINITIONS = TOPIC_TREES.map((tree) => {
  const topic = getTopicById(tree.topicId);

  if (!topic) {
    return null;
  }

  const points = tree.subtopics.map((subtopic) => {
    const schema = REVISION_SCHEMA_BY_SUBTOPIC.get(subtopic.id);

    return {
      id: subtopic.id,
      label: subtopic.label,
      keyTerms: uniqueStrings(subtopic.keywords),
      conceptGroups: schema
        ? buildSchemaConceptGroups(schema)
        : buildFallbackConceptGroups(subtopic.keywords),
      prompt: schema?.prompt,
      schema,
      misconceptions: schema
        ? schema.misconceptions.map((misconception) => ({
            id: misconception.id,
            label: misconception.label,
            explanation: misconception.explanation,
            groups: misconception.groups.map((group) => ({
              label: group.anyOf.slice(0, 2).join(" / "),
              phrases: uniqueStrings(group.anyOf),
            })),
          }))
        : [],
    } satisfies DiagnosticCurriculumPointDefinition;
  });

  return {
    topicId: tree.topicId,
    label: topic.label,
    icon: topic.icon,
    description: tree.description,
    points,
  } satisfies DiagnosticTopicDefinition;
}).filter(isNotNull);

const DIAGNOSTIC_TOPIC_MAP = new Map(
  DIAGNOSTIC_TOPIC_DEFINITIONS.map((topic) => [topic.topicId, topic])
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function getDiagnosticTopicOrder(topicId: string) {
  return DIAGNOSTIC_TOPICS.findIndex((topic) => topic.id === topicId);
}

function buildSchemaConceptGroups(schema: RevisionQuestionSchema): DiagnosticPhraseGroup[] {
  return schema.concepts.map((concept) => ({
    label: concept.label,
    phrases: uniqueStrings(concept.requiredGroups.flatMap((group) => group.anyOf)),
  }));
}

function buildFallbackConceptGroups(keywords: string[]): DiagnosticPhraseGroup[] {
  const signals = uniqueStrings(keywords).slice(0, 6);

  if (signals.length === 0) {
    return [];
  }

  const groupCount = Math.min(3, signals.length);
  const chunkSize = Math.max(1, Math.ceil(signals.length / groupCount));
  const groups: DiagnosticPhraseGroup[] = [];

  for (let index = 0; index < signals.length; index += chunkSize) {
    const phrases = signals.slice(index, index + chunkSize);
    groups.push({
      label: phrases.slice(0, 2).join(" / "),
      phrases,
    });
  }

  return groups.slice(0, 3);
}

function findBestEvidence(normalizedText: ReturnType<typeof normalizeText>, phrases: string[]) {
  let best:
    | {
        phrase: string;
        similarity: number;
        start: number;
        end: number;
      }
    | null = null;

  for (const phrase of phrases) {
    const evidence = findPhraseEvidence(normalizedText, phrase);

    if (!evidence || isNegated(normalizedText.tokens, evidence.start, evidence.end)) {
      continue;
    }

    if (!best || evidence.similarity > best.similarity) {
      best = {
        phrase,
        similarity: evidence.similarity,
        start: evidence.start,
        end: evidence.end,
      };
    }
  }

  return best;
}

function matchTerms(normalizedText: ReturnType<typeof normalizeText>, terms: string[]) {
  const matchedTerms: string[] = [];

  for (const term of uniqueStrings(terms)) {
    const evidence = findBestEvidence(normalizedText, [term]);

    if (evidence) {
      matchedTerms.push(term);
    }
  }

  return matchedTerms;
}

function toStatus(
  coverage: number,
  misconceptions: DiagnosticMisconceptionFinding[],
  matchedTerms: string[]
): DiagnosticPointStatus {
  if (misconceptions.length > 0) {
    return "misconception";
  }

  if (coverage >= 0.72) {
    return "covered";
  }

  if (coverage >= 0.22 || matchedTerms.length > 0) {
    return "partial";
  }

  return "unassessed";
}

function buildPointNote(
  point: DiagnosticCurriculumPointDefinition,
  status: DiagnosticPointStatus,
  matchedTerms: string[],
  missingTerms: string[],
  misconceptions: DiagnosticMisconceptionFinding[],
  fallback?: string
) {
  if (status === "misconception" && misconceptions[0]) {
    return misconceptions[0].explanation;
  }

  if (status === "covered") {
    return undefined;
  }

  if (fallback) {
    return fallback;
  }

  if (matchedTerms.length > 0 && missingTerms.length > 0) {
    return `Covered ${matchedTerms.slice(0, 2).join(" and ")}, but still missing ${missingTerms
      .slice(0, 2)
      .join(" and ")}.`;
  }

  if (matchedTerms.length > 0) {
    return `Mentioned ${matchedTerms.slice(0, 2).join(" and ")}, but the point needs a fuller explanation.`;
  }

  return `No reliable signal yet for ${point.label.toLowerCase()}.`;
}

function takeFirstSentence(text: string) {
  const boundary = text.indexOf(". ");

  if (boundary === -1) {
    return text.trim();
  }

  return text.slice(0, boundary + 1).trim();
}

function assessSchemaPoint(
  point: DiagnosticCurriculumPointDefinition,
  response: string,
  normalizedText: ReturnType<typeof normalizeText>
): {
  pointAssessment: DiagnosticPointAssessment;
  misconceptions: DiagnosticMisconceptionFinding[];
} {
  const evaluation = evaluateRevisionAnswerWithSchema(point.schema as RevisionQuestionSchema, response);
  const matchedTerms = uniqueStrings([
    ...matchTerms(normalizedText, point.keyTerms),
    ...evaluation.conceptBreakdown.flatMap((concept) => concept.matchedEvidence),
  ]);
  const matchedNormalizedTerms = new Set(matchedTerms.map((term) => normalizeString(term)));
  const missingTerms = uniqueStrings([
    ...evaluation.conceptBreakdown.flatMap((concept) => concept.missingEvidence),
    ...point.keyTerms.filter((term) => !matchedNormalizedTerms.has(normalizeString(term))),
  ]).slice(0, 4);
  const conceptCoverage =
    evaluation.conceptBreakdown.length > 0
      ? evaluation.conceptBreakdown.reduce(
          (total, concept) => total + concept.coverage,
          0
        ) / evaluation.conceptBreakdown.length
      : 0;
  const directCoverage =
    point.keyTerms.length > 0
      ? Math.min(1, matchedTerms.length / Math.min(4, point.keyTerms.length))
      : conceptCoverage;
  const coverage = clamp(conceptCoverage * 0.75 + directCoverage * 0.25, 0, 1);
  const misconceptions = evaluation.misconceptionBreakdown.map((misconception) => ({
    id: misconception.id,
    pointId: point.id,
    label: misconception.label,
    explanation: misconception.explanation,
  }));
  const status = toStatus(coverage, misconceptions, matchedTerms);

  return {
    pointAssessment: {
      pointId: point.id,
      label: point.label,
      status,
      confidence: evaluation.confidence,
      matchedTerms,
      missingTerms,
      evidence: matchedTerms.slice(0, 4),
      notes: buildPointNote(
        point,
        status,
        matchedTerms,
        missingTerms,
        misconceptions,
        takeFirstSentence(evaluation.feedback)
      ),
    },
    misconceptions,
  };
}

function assessFallbackPoint(
  point: DiagnosticCurriculumPointDefinition,
  normalizedText: ReturnType<typeof normalizeText>
): {
  pointAssessment: DiagnosticPointAssessment;
  misconceptions: DiagnosticMisconceptionFinding[];
} {
  const matchedTerms = matchTerms(normalizedText, point.keyTerms);
  const matchedNormalizedTerms = new Set(matchedTerms.map((term) => normalizeString(term)));
  const matchedGroupCount = point.conceptGroups.reduce((total, group) => {
    const evidence = findBestEvidence(normalizedText, group.phrases);
    return total + (evidence ? 1 : 0);
  }, 0);
  const groupCoverage =
    point.conceptGroups.length > 0
      ? matchedGroupCount / point.conceptGroups.length
      : 0;
  const termCoverage =
    point.keyTerms.length > 0
      ? Math.min(1, matchedTerms.length / Math.min(4, point.keyTerms.length))
      : groupCoverage;
  const coverage = clamp(groupCoverage * 0.7 + termCoverage * 0.3, 0, 1);
  const misconceptions = point.misconceptions.flatMap((signal) => {
    const matched = signal.groups.some((group) =>
      Boolean(findBestEvidence(normalizedText, group.phrases))
    );

    return matched
      ? [
          {
            id: signal.id,
            pointId: point.id,
            label: signal.label,
            explanation: signal.explanation,
          } satisfies DiagnosticMisconceptionFinding,
        ]
      : [];
  });
  const missingTerms = point.keyTerms
    .filter((term) => !matchedNormalizedTerms.has(normalizeString(term)))
    .slice(0, 4);
  const confidence = roundToTenth(
    clamp(
      0.26 +
        coverage * 0.46 +
        Math.min(normalizedText.tokens.length / 60, 0.16) +
        (matchedTerms.length > 0 ? 0.08 : 0) -
        misconceptions.length * 0.08,
      0.18,
      0.92
    )
  );
  const status = toStatus(coverage, misconceptions, matchedTerms);

  return {
    pointAssessment: {
      pointId: point.id,
      label: point.label,
      status,
      confidence,
      matchedTerms,
      missingTerms,
      evidence: matchedTerms.slice(0, 4),
      notes: buildPointNote(point, status, matchedTerms, missingTerms, misconceptions),
    },
    misconceptions,
  };
}

function buildFollowUpQuestion(
  point: DiagnosticPointAssessment,
  definition: DiagnosticCurriculumPointDefinition,
  reason: DiagnosticFollowUpReason
) {
  const focusTerms = point.missingTerms.slice(0, 2);
  const focusText =
    focusTerms.length > 0 ? focusTerms.join(" and ") : point.label.toLowerCase();

  if (reason === "misconception") {
    return `You may be mixing up ${point.label}. Re-explain ${point.label.toLowerCase()} carefully, especially ${focusText}.`;
  }

  if (reason === "missing-point" && definition.prompt) {
    return `${definition.prompt} Focus on ${focusText}.`;
  }

  if (reason === "weak-point") {
    return `You touched on ${point.label}, but I still need clearer evidence for ${focusText}. How would you explain that part?`;
  }

  if (reason === "low-confidence") {
    return `Give one concrete explanation or example for ${point.label}. Keep it focused on ${focusText}.`;
  }

  return `I still have no clear evidence for ${point.label}. What do you know about ${focusText}?`;
}

function getPointPriority(point: DiagnosticPointAssessment) {
  if (point.status === "misconception") {
    return {
      reason: "misconception" as DiagnosticFollowUpReason,
      score: 400 - point.confidence * 100,
    };
  }

  if (point.status === "unassessed") {
    return {
      reason: "missing-point" as DiagnosticFollowUpReason,
      score: 300 - point.confidence * 100,
    };
  }

  if (point.status === "partial") {
    return {
      reason:
        point.confidence < 0.48
          ? ("low-confidence" as DiagnosticFollowUpReason)
          : ("weak-point" as DiagnosticFollowUpReason),
      score: 220 - point.confidence * 100,
    };
  }

  if (point.confidence < 0.52) {
    return {
      reason: "low-confidence" as DiagnosticFollowUpReason,
      score: 120 - point.confidence * 100,
    };
  }

  return null;
}

function selectNextFollowUp(
  topic: DiagnosticTopicDefinition,
  report: TopicDiagnosticReport
) {
  if (report.followUps.length >= MAX_FOLLOW_UPS) {
    return null;
  }

  const openIssues = report.curriculumPoints.filter(
    (point) => point.status !== "covered"
  ).length;

  if (report.confidence >= 0.86 && openIssues <= 1 && report.misconceptions.length === 0) {
    return null;
  }

  const askedPointIds = new Set(report.followUps.map((followUp) => followUp.targetedPointId));
  const candidates = report.curriculumPoints
    .map((point) => {
      if (askedPointIds.has(point.pointId)) {
        return null;
      }

      const priority = getPointPriority(point);

      if (!priority) {
        return null;
      }

      const definition = topic.points.find(
        (curriculumPoint) => curriculumPoint.id === point.pointId
      );

      if (!definition) {
        return null;
      }

      return {
        point,
        definition,
        reason: priority.reason,
        score: priority.score,
      };
    })
    .filter(
      (
        candidate
      ): candidate is {
        point: DiagnosticPointAssessment;
        definition: DiagnosticCurriculumPointDefinition;
        reason: DiagnosticFollowUpReason;
        score: number;
      } => Boolean(candidate)
    )
    .sort((left, right) => right.score - left.score);

  const nextCandidate = candidates[0];

  if (!nextCandidate) {
    return null;
  }

  return {
    id: `${topic.topicId}-${nextCandidate.point.pointId}-${report.followUps.length + 1}`,
    targetedPointId: nextCandidate.point.pointId,
    question: buildFollowUpQuestion(
      nextCandidate.point,
      nextCandidate.definition,
      nextCandidate.reason
    ),
    reason: nextCandidate.reason,
  } satisfies DiagnosticFollowUpQuestion;
}

function buildTopicScore(report: TopicDiagnosticReport): TopicScore {
  const statusWeights: Record<DiagnosticPointStatus, number> = {
    covered: 1,
    partial: 0.58,
    unassessed: 0.18,
    misconception: 0.22,
  };

  const weightedCoverage =
    report.curriculumPoints.length > 0
      ? report.curriculumPoints.reduce(
          (total, point) => total + statusWeights[point.status],
          0
        ) / report.curriculumPoints.length
      : 0;
  const confidenceBoost = report.confidence >= 0.72 ? 0.04 : 0;
  const normalizedScore = clamp(weightedCoverage + confidenceBoost, 0, 1);

  return {
    topic: report.topicLabel,
    category: report.topicId,
    score: Math.round(normalizedScore * 25),
    maxScore: 25,
  };
}

function mergeTopicScores(existing: TopicScore[], nextScore: TopicScore) {
  return [...existing.filter((score) => score.category !== nextScore.category), nextScore].sort(
    (left, right) =>
      getDiagnosticTopicOrder(left.category) - getDiagnosticTopicOrder(right.category)
  );
}

function mergeTopicDiagnostics(
  existing: TopicDiagnosticReport[],
  nextReport: TopicDiagnosticReport
) {
  return [
    ...existing.filter((report) => report.topicId !== nextReport.topicId),
    nextReport,
  ].sort(
    (left, right) =>
      getDiagnosticTopicOrder(left.topicId) - getDiagnosticTopicOrder(right.topicId)
  );
}

function buildQuestionCount(
  topicDiagnostics: TopicDiagnosticReport[],
  topicScores: TopicScore[]
) {
  const structuredTopicIds = new Set(
    topicDiagnostics.map((topicDiagnostic) => topicDiagnostic.topicId)
  );
  const structuredQuestionCount = topicDiagnostics.reduce(
    (total, topicDiagnostic) => total + 1 + topicDiagnostic.followUps.length,
    0
  );
  const legacyTopicCount = topicScores.filter(
    (topicScore) => !structuredTopicIds.has(topicScore.category)
  ).length;

  return structuredQuestionCount + legacyTopicCount;
}

function buildRecommendedMaterialIds(topicId: string) {
  return getRecommendedMaterialCards([topicId], 3).map((material) => material.id);
}

export function getDiagnosticTopics() {
  return DIAGNOSTIC_TOPICS;
}

export function getTopicDiagnosticDefinition(topicId: string) {
  return DIAGNOSTIC_TOPIC_MAP.get(topicId as TopicId) ?? null;
}

export function analyzeTopicDiagnosticSession(
  input: TopicDiagnosticSessionInput
): TopicDiagnosticSessionAnalysis {
  const topic = getTopicDiagnosticDefinition(input.topicId);

  if (!topic) {
    throw new Error(`Unknown topic for diagnostic: ${input.topicId}`);
  }

  const followUps = input.followUps ?? [];
  const combinedResponse = [input.freeformResponse, ...followUps.map((followUp) => followUp.answer)]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");
  const normalizedText = normalizeText(combinedResponse);
  const assessedPoints = topic.points.map((point) =>
    point.schema
      ? assessSchemaPoint(point, combinedResponse, normalizedText)
      : assessFallbackPoint(point, normalizedText)
  );
  const curriculumPoints = assessedPoints.map((result) => result.pointAssessment);
  const misconceptions = uniqueMisconceptions(
    assessedPoints.flatMap((result) => result.misconceptions)
  );
  const keyTermsMatched = uniqueStrings(
    curriculumPoints.flatMap((point) => point.matchedTerms)
  );
  const coveredCount = curriculumPoints.filter((point) => point.status === "covered").length;
  const partialCount = curriculumPoints.filter((point) => point.status === "partial").length;
  const reportConfidence = roundToTenth(
    clamp(
      0.32 +
        (coveredCount / Math.max(curriculumPoints.length, 1)) * 0.38 +
        (partialCount / Math.max(curriculumPoints.length, 1)) * 0.12 +
        (curriculumPoints.reduce((total, point) => total + point.confidence, 0) /
          Math.max(curriculumPoints.length, 1)) *
          0.2 -
        misconceptions.length * 0.05,
      0.2,
      0.96
    )
  );
  const suggestedNextTargets = curriculumPoints
    .filter((point) => point.status !== "covered")
    .sort((left, right) => {
      const priorityLeft = getPointPriority(left)?.score ?? 0;
      const priorityRight = getPointPriority(right)?.score ?? 0;
      return priorityRight - priorityLeft;
    })
    .map((point) => `${point.pointId} ${point.label}`)
    .slice(0, 4);

  const report: TopicDiagnosticReport = {
    topicId: topic.topicId,
    topicLabel: topic.label,
    topicIcon: topic.icon,
    assessedAt: new Date().toISOString(),
    freeformResponse: input.freeformResponse.trim(),
    curriculumPoints,
    keyTermsMatched,
    misconceptions,
    confidence: reportConfidence,
    suggestedNextTargets,
    recommendedMaterialIds: buildRecommendedMaterialIds(topic.topicId),
    followUps,
  };

  return {
    topic,
    report,
    nextFollowUp: selectNextFollowUp(topic, report),
  };
}

function uniqueMisconceptions(findings: DiagnosticMisconceptionFinding[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.pointId ?? "topic"}:${finding.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function mergeDiagnosticResult(
  existingResult: DiagnosticResult | null,
  topicReport: TopicDiagnosticReport
): DiagnosticResult {
  const nextTopicScores = mergeTopicScores(
    existingResult?.topicScores ?? [],
    buildTopicScore(topicReport)
  );
  const nextTopicDiagnostics = mergeTopicDiagnostics(
    existingResult?.topicDiagnostics ?? [],
    topicReport
  );
  const assessedTopicIds = uniqueStrings([
    ...(existingResult?.assessedTopicIds ?? []),
    ...nextTopicScores.map((topicScore) => topicScore.category),
  ]);
  const unassessedTopicIds = DIAGNOSTIC_TOPICS.map((topic) => topic.id).filter(
    (topicId) => !assessedTopicIds.includes(topicId)
  );
  const overallScore = nextTopicScores.length
    ? Math.round(
        nextTopicScores.reduce(
          (total, topicScore) => total + (topicScore.score / topicScore.maxScore) * 100,
          0
        ) / nextTopicScores.length
      )
    : 0;

  return {
    id: existingResult?.id,
    completedAt: new Date().toISOString(),
    overallScore,
    questionCount: buildQuestionCount(nextTopicDiagnostics, nextTopicScores),
    topicScores: nextTopicScores,
    version: 2,
    latestTopicId: topicReport.topicId,
    assessedTopicIds,
    unassessedTopicIds,
    recommendedTopicIds: [...nextTopicScores]
      .sort((left, right) => left.score / left.maxScore - right.score / right.maxScore)
      .slice(0, 3)
      .map((topicScore) => topicScore.category),
    topicDiagnostics: nextTopicDiagnostics,
  };
}

export function getTopicScoreLabel(topicId: string) {
  return getTopicLabel(topicId);
}

const LEGACY_DIAGNOSTIC_QUESTION_TOPIC_IDS: TopicId[] = [
  "problem-solving",
  "intro-programming",
  "security",
  "legislation",
  "data",
  "digital-environments",
];

const LEGACY_DIAGNOSTIC_BASE_TOPIC_IDS: TopicId[] = [
  "problem-solving",
  "intro-programming",
  "emerging-issues",
  "legislation",
  "business",
  "data",
  "digital-environments",
  "security",
];

export function buildDiagnosticResult(
  answers: number[],
  weakAreas: string[] = []
): DiagnosticResult {
  const completedAt = new Date().toISOString();
  const correctCount = answers.filter((answer) => answer === 0).length;
  const answerMap = new Map<TopicId, boolean>();

  LEGACY_DIAGNOSTIC_QUESTION_TOPIC_IDS.forEach((topicId, index) => {
    answerMap.set(topicId, answers[index] === 0);
  });

  const topicScores: TopicScore[] = LEGACY_DIAGNOSTIC_BASE_TOPIC_IDS.map((topicId) => {
    const isWeakArea = weakAreas.includes(topicId);
    const answered = answerMap.get(topicId);
    let score = 14;

    if (answered === true) {
      score = isWeakArea ? 18 : 21;
    } else if (answered === false) {
      score = isWeakArea ? 8 : 11;
    } else if (isWeakArea) {
      score = 10;
    } else if (topicId === "business" || topicId === "emerging-issues") {
      score = 15 + (correctCount >= 4 ? 1 : 0);
    }

    return {
      topic: getTopicLabel(topicId),
      category: topicId,
      score,
      maxScore: 25,
    };
  });

  const overallScore = Math.round(
    topicScores.reduce(
      (sum, topic) => sum + (topic.score / topic.maxScore) * 100,
      0
    ) / topicScores.length
  );

  return {
    completedAt,
    overallScore,
    questionCount: answers.length,
    topicScores,
  };
}
