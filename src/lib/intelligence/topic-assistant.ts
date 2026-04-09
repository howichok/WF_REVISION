import { extractCommandWord } from "@/lib/command-words";
import {
  getMarkSchemeConceptsForQuestion,
  getResourceHref,
  getTopicContentBundle,
  getTopicCoverageGraph,
  isResourceExternal,
  searchStructuredContent,
} from "@/lib/content";
import { getPracticeQuestionsForTopic } from "@/lib/intelligence/catalog";
import { stringSimilarity } from "@/lib/intelligence/fuzzy";
import { normalizeText } from "@/lib/intelligence/normalize";
import { REVISION_QUESTION_SCHEMAS } from "@/lib/intelligence/rules/revision";
import { evaluateRevisionAnswerWithSchema } from "@/lib/intelligence/scoring";
import { getTopicPracticeBundle, type PracticeExamDrill } from "@/lib/practice";
import {
  generateGeminiCoachResponse,
  type GeminiCoachRequest,
  type GeminiCoachResponse,
} from "@/lib/research/gemini-coach";
import { generateGroundedResearchAnswer } from "@/lib/research/google-grounding";
import type { GroundedResearchResponse } from "@/lib/research/types";
import { getTopicById } from "@/lib/types";
import type {
  PublicRevisionQuestion,
  RevisionQuestionSchema,
  TopicIntelligenceConfidence,
  TopicIntelligenceIntent,
  TopicIntelligenceNextAction,
  TopicIntelligenceRelatedQuestion,
  TopicIntelligenceRelatedResource,
  TopicIntelligenceRequest,
  TopicIntelligenceResponse,
  TopicIntelligenceSource,
} from "./types";

const OFFICIAL_GROUNDED_HOSTS = [
  "qualifications.pearson.com",
  "tlevels.gov.uk",
  "support.tlevels.gov.uk",
] as const;

const HINT_KEYWORDS = [
  "hint",
  "structure",
  "plan",
  "outline",
  "how to answer",
  "\u043f\u043e\u0434\u0441\u043a\u0430\u0437",
  "\u043a\u0430\u043a \u043d\u0430\u0447\u0430\u0442\u044c",
  "\u0447\u0442\u043e \u043d\u0430\u043f\u0438\u0441\u0430\u0442\u044c",
];
const ANSWER_CHECK_KEYWORDS = [
  "check",
  "mark my answer",
  "review my answer",
  "is my answer good",
  "\u043e\u0446\u0435\u043d\u0438",
  "\u043f\u0440\u043e\u0432\u0435\u0440\u044c \u043c\u043e\u0439 \u043e\u0442\u0432\u0435\u0442",
  "\u043f\u0440\u043e\u0432\u0435\u0440\u044c",
];
const PRACTICE_KEYWORDS = [
  "question",
  "practice",
  "quiz",
  "exam prompt",
  "test me",
  "\u0434\u0430\u0439 \u0432\u043e\u043f\u0440\u043e\u0441",
];
const RESOURCE_KEYWORDS = [
  "source",
  "resource",
  "where can i read",
  "spec",
  "specification",
  "official source",
  "\u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u044b\u0439 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a",
];
const GROUNDED_KEYWORDS = [
  "official",
  "confirm",
  "latest",
  "current",
  "today",
  "up to date",
  "exact wording",
  "citation",
  "source trail",
];
const MISCONCEPTION_KEYWORDS = [
  "vs",
  "versus",
  "difference between",
  "confus",
  "mixing up",
  "not the same as",
  "compare between",
];

interface RankedMatch<T> {
  value: T;
  score: number;
}

type TopicContentBundle = ReturnType<typeof getTopicContentBundle>;

interface LocalTopicMatchSummary {
  topicId: string;
  topicLabel: string;
  query: string;
  confidence: TopicIntelligenceConfidence;
  confidenceScore: number;
  hasCrossSignal: boolean;
  curriculumPoints: TopicContentBundle["officialPoints"];
  glossaryTerms: TopicContentBundle["terms"];
  resources: TopicContentBundle["resources"];
  questions: TopicContentBundle["questions"];
  rankedSchemas: RankedMatch<RevisionQuestionSchema>[];
  rankedRevisionQuestions: RankedMatch<PublicRevisionQuestion>[];
  rankedDrills: RankedMatch<PracticeExamDrill>[];
  coverageNodes: NonNullable<ReturnType<typeof getTopicCoverageGraph>>["coverageByPoint"];
}

interface TopicIntelligenceDependencies {
  groundedResolver?: (
    request: TopicIntelligenceRequest
  ) => Promise<GroundedResearchResponse>;
  coachResolver?: (
    request: GeminiCoachRequest
  ) => Promise<GeminiCoachResponse>;
}

function containsAny(haystack: string, candidates: string[]) {
  return candidates.some((candidate) => haystack.includes(candidate));
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function trimWords(value: string, maxWords = 120) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function lowerFirst(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function stripTrailingPunctuation(value: string) {
  return value.replace(/[.:\s]+$/, "").trim();
}

function sentenceFragments(value: string) {
  return value
    .split(/[.;\n]/)
    .map((part) => stripTrailingPunctuation(part))
    .filter((part) => part.length >= 8);
}

function shorten(value: string, maxLength = 140) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function scoreAssistantTextMatch(query: string, values: Array<string | undefined>) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery.normalized) {
    return 0;
  }

  const normalizedValues = values
    .filter(Boolean)
    .map((value) => normalizeText(value ?? ""))
    .filter((value) => value.normalized);

  let score = 0;

  for (const value of normalizedValues) {
    if (value.normalized === normalizedQuery.normalized) {
      score = Math.max(score, 18);
      continue;
    }

    if (
      value.normalized.includes(normalizedQuery.normalized) ||
      normalizedQuery.normalized.includes(value.normalized)
    ) {
      score = Math.max(score, 14);
    }

    const similarity = stringSimilarity(normalizedQuery.normalized, value.normalized);
    if (similarity >= 0.88) {
      score = Math.max(score, Math.round(10 * similarity));
    }

    for (const token of normalizedQuery.tokens) {
      if (token.length < 2) {
        continue;
      }

      if (value.tokens.includes(token)) {
        score += token.length > 4 ? 4 : 2;
        continue;
      }

      const fuzzyToken = value.tokens.some(
        (candidate) => stringSimilarity(token, candidate) >= 0.9
      );
      if (fuzzyToken) {
        score += 1;
      }
    }
  }

  return score;
}

function rankMatches<T>(
  values: T[],
  scorer: (value: T) => number,
  minimumScore = 1
): RankedMatch<T>[] {
  return values
    .map((value) => ({
      value,
      score: scorer(value),
    }))
    .filter((entry) => entry.score >= minimumScore)
    .sort((left, right) => right.score - left.score);
}

function getBestTopicQuery(topicId: string, query: string) {
  const trimmed = query.trim();
  if (trimmed) {
    return trimmed;
  }

  return getTopicById(topicId)?.label ?? topicId;
}

export function detectTopicIntelligenceIntent(
  request: Pick<TopicIntelligenceRequest, "query" | "overrideIntent" | "draftAnswer">
): TopicIntelligenceIntent {
  if (request.overrideIntent) {
    return request.overrideIntent;
  }

  if (request.draftAnswer?.trim()) {
    return "answer-check";
  }

  const query = request.query.trim().toLowerCase();

  if (containsAny(query, HINT_KEYWORDS)) {
    return "hint";
  }

  if (containsAny(query, ANSWER_CHECK_KEYWORDS)) {
    return "answer-check";
  }

  if (containsAny(query, PRACTICE_KEYWORDS)) {
    return "practice-question";
  }

  if (containsAny(query, RESOURCE_KEYWORDS)) {
    return "resource-pick";
  }

  if (containsAny(query, GROUNDED_KEYWORDS)) {
    return "grounded-answer";
  }

  return "local-answer";
}

export function classifyTopicIntelligenceConfidence(
  score: number,
  hasCrossSignal: boolean
): TopicIntelligenceConfidence {
  if (hasCrossSignal || score >= 28) {
    return "high";
  }

  if (score >= 16) {
    return "medium";
  }

  return "low";
}

export function isOfficialGroundedHost(host: string) {
  const normalizedHost = host.trim().toLowerCase().replace(/^www\./, "");
  return OFFICIAL_GROUNDED_HOSTS.some((candidate) => normalizedHost === candidate);
}

function rankTopicContentMatches(topicId: string, query: string) {
  const bundle = getTopicContentBundle(topicId);
  const fallback = searchStructuredContent(query, { legacyTopicId: topicId });

  const curriculumPoints = rankMatches(bundle.officialPoints, (point) =>
    scoreAssistantTextMatch(query, [
      point.code,
      point.title,
      point.summary,
      point.relatedTerms.join(" "),
      point.relatedConcepts.join(" "),
      ...point.practicePrompts,
      ...point.markSchemeIdeas,
    ])
  )
    .slice(0, 6)
    .map((entry) => entry.value);

  const glossaryTerms = rankMatches(bundle.terms, (term) =>
    scoreAssistantTextMatch(query, [term.term, term.definition, term.aliases?.join(" ")])
  )
    .slice(0, 8)
    .map((entry) => entry.value);

  const resources = rankMatches(bundle.resources, (resource) =>
    scoreAssistantTextMatch(query, [
      resource.title,
      resource.summary,
      resource.tags.join(" "),
    ])
  )
    .slice(0, 6)
    .map((entry) => entry.value);

  const questions = rankMatches(bundle.questions, (question) =>
    scoreAssistantTextMatch(query, [
      question.title,
      question.summary,
      question.expectation,
      question.practicePrompt,
      question.sourceLabel,
    ])
  )
    .slice(0, 6)
    .map((entry) => entry.value);

  return {
    curriculumPoints: curriculumPoints.length > 0 ? curriculumPoints : fallback.curriculumPoints,
    glossaryTerms: glossaryTerms.length > 0 ? glossaryTerms : fallback.glossaryTerms,
    resources: resources.length > 0 ? resources : fallback.resources,
    questions: questions.length > 0 ? questions : fallback.questions,
  };
}

function buildLocalMatchSummary(topicId: string, query: string): LocalTopicMatchSummary {
  const topic = getTopicById(topicId);
  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  const resolvedQuery = getBestTopicQuery(topicId, query);
  const structured = rankTopicContentMatches(topicId, resolvedQuery);
  const practiceBundle = getTopicPracticeBundle(topicId);
  const coverageGraph = getTopicCoverageGraph(topicId);
  const topicSchemas = REVISION_QUESTION_SCHEMAS.filter((schema) => schema.topicId === topicId);
  const topicRevisionQuestions = getPracticeQuestionsForTopic(topicId);
  const queryCommandWord = extractCommandWord(resolvedQuery);

  const rankedSchemas = rankMatches(topicSchemas, (schema) =>
    scoreAssistantTextMatch(resolvedQuery, [
      schema.prompt,
      ...schema.rubricSummary,
      ...schema.concepts.map((concept) => concept.label),
      ...schema.misconceptions.map((misconception) => misconception.label),
    ])
  );

  const rankedRevisionQuestions = rankMatches(topicRevisionQuestions, (question) =>
    scoreAssistantTextMatch(resolvedQuery, [question.prompt, ...question.rubricSummary])
  );

  const rankedDrills = rankMatches(practiceBundle.examDrills, (drill) => {
    const base = scoreAssistantTextMatch(resolvedQuery, [
      drill.title,
      drill.prompt,
      drill.answerFocus,
      ...drill.checklist,
    ]);
    const drillCommandWord = extractCommandWord(drill.prompt);

    if (queryCommandWord && drillCommandWord?.id === queryCommandWord.id) {
      return base + 8;
    }

    return base;
  });
  const coverageNodes =
    rankMatches(
      coverageGraph?.coverageByPoint ?? [],
      (node) =>
        scoreAssistantTextMatch(resolvedQuery, [
          node.pointCode,
          node.pointTitle,
          node.relatedTerms.join(" "),
          node.relatedConcepts.join(" "),
          node.commandWordTargets.join(" "),
          node.improvementSignals.join(" "),
          node.misconceptionSignals.join(" "),
          ...node.rewriteRules.flatMap((rule) => [rule.target, rule.hint, rule.microRewrite]),
        ]),
      1
    )
      .map((entry) => entry.value)
      .slice(0, 3);

  const confidenceScore =
    (structured.curriculumPoints[0] ? 12 : 0) +
    (structured.glossaryTerms[0] ? 8 : 0) +
    (structured.resources[0] ? 6 : 0) +
    (structured.questions[0] ? 8 : 0) +
    (rankedSchemas[0] ? 6 : 0) +
    (coverageNodes[0] ? 6 : 0) +
    (rankedDrills[0] ? 4 : 0) +
    (coverageNodes[0]?.followUpQuestionIds.length ? 4 : 0);

  const hasCrossSignal =
    (
      structured.curriculumPoints.length > 0 &&
      (
        structured.glossaryTerms.length > 0 ||
        structured.resources.length > 0 ||
        structured.questions.length > 0 ||
        rankedSchemas.length > 0
      )
    ) ||
    (coverageNodes.length > 0 && rankedDrills.length > 0);

  return {
    topicId,
    topicLabel: topic.label,
    query: resolvedQuery,
    confidence: classifyTopicIntelligenceConfidence(confidenceScore, hasCrossSignal),
    confidenceScore,
    hasCrossSignal,
    curriculumPoints: structured.curriculumPoints,
    glossaryTerms: structured.glossaryTerms,
    resources: structured.resources,
    questions: structured.questions,
    rankedSchemas,
    rankedRevisionQuestions,
    rankedDrills,
    coverageNodes,
  };
}

function buildAction(
  label: string,
  href: string,
  kind: "route" | "external"
): TopicIntelligenceNextAction {
  return { label, href, kind };
}

function getPrimaryCoverageNode(summary: LocalTopicMatchSummary) {
  return summary.coverageNodes[0] ?? null;
}

function buildCoverageRewriteCue(summary: LocalTopicMatchSummary) {
  const rule = getPrimaryCoverageNode(summary)?.rewriteRules[0];

  if (!rule) {
    return null;
  }

  return rule.microRewrite
    ? `Replace vague wording like "${rule.target}" with something closer to "${rule.microRewrite}".`
    : rule.hint;
}

function buildMisconceptionCandidates(
  summary: LocalTopicMatchSummary,
  limit = 2
) {
  const primaryNode = getPrimaryCoverageNode(summary);
  const termContrast = buildContrastSentence(summary);

  return uniqueStrings([
    ...(primaryNode?.misconceptionSignals ?? []),
    ...(summary.rankedSchemas[0]?.value.misconceptions
      .map((misconception) => misconception.explanation)
      .slice(0, 2) ?? []),
    termContrast,
  ])
    .map((candidate) => shorten(candidate, 150))
    .slice(0, limit);
}

function withLocalProvider(
  response: TopicIntelligenceResponse
): TopicIntelligenceResponse {
  return {
    provider: response.provider ?? "local-rule-engine",
    ...response,
  };
}

function toRelatedResources(
  resources: LocalTopicMatchSummary["resources"]
): TopicIntelligenceRelatedResource[] {
  return resources.slice(0, 3).map((resource) => ({
    id: resource.id,
    title: resource.title,
    summary: resource.summary,
    href: getResourceHref(resource),
    isExternal: isResourceExternal(resource),
  }));
}

function toRevisionQuestionHref(topicId: string, questionId: string) {
  return `/revision/${topicId}/exam-questions?questionId=${encodeURIComponent(questionId)}`;
}

function toExamDrillHref(topicId: string, drillId?: string) {
  if (!drillId) {
    return `/revision/${topicId}/exam-questions`;
  }

  return `/revision/${topicId}/exam-questions?drillId=${encodeURIComponent(drillId)}`;
}

function toPaperPromptsHref(topicId: string) {
  return `/revision/${topicId}/paper-prompts`;
}

function toRelatedQuestions(summary: LocalTopicMatchSummary): TopicIntelligenceRelatedQuestion[] {
  const related: TopicIntelligenceRelatedQuestion[] = [];

  for (const entry of summary.rankedRevisionQuestions.slice(0, 2)) {
    related.push({
      id: entry.value.id,
      title: "Written answer prompt",
      prompt: entry.value.prompt,
      sourceLabel: "Answer check rubric",
      href: toRevisionQuestionHref(summary.topicId, entry.value.id),
      marks: entry.value.maxScore,
      kind: "answer-check",
    });
  }

  for (const entry of summary.questions.slice(0, 2)) {
    related.push({
      id: entry.id,
      title: entry.title,
      prompt: entry.practicePrompt,
      sourceLabel: entry.sourceLabel,
      href: toPaperPromptsHref(summary.topicId),
      marks: entry.marks,
      kind: "exam-question",
    });
  }

  for (const entry of summary.rankedDrills.slice(0, 1)) {
    related.push({
      id: entry.value.id,
      title: entry.value.title,
      prompt: entry.value.prompt,
      sourceLabel: entry.value.sourceLabel,
      href: toExamDrillHref(summary.topicId, entry.value.id),
      marks: entry.value.marks,
      kind: "exam-drill",
    });
  }

  return related.slice(0, 3);
}

function toHost(href?: string) {
  if (!href) {
    return undefined;
  }

  try {
    return new URL(href).hostname.replace(/^www\./i, "");
  } catch {
    return undefined;
  }
}

function getAllowlistedOfficialResource(summary: LocalTopicMatchSummary) {
  return summary.resources.find((resource) => {
    if (!isResourceExternal(resource)) {
      return false;
    }

    return isOfficialGroundedHost(toHost(getResourceHref(resource)) ?? "");
  });
}

function buildLocalSources(summary: LocalTopicMatchSummary): TopicIntelligenceSource[] {
  const sources: TopicIntelligenceSource[] = [];
  const point = summary.curriculumPoints[0];

  if (point) {
    sources.push({
      id: point.id,
      title: `${point.code} ${point.title}`,
      type: "local-point",
      note: point.summary,
    });
  }

  for (const resource of summary.resources.slice(0, 3)) {
    const href = getResourceHref(resource);
    sources.push({
      id: resource.id,
      title: resource.title,
      type: isResourceExternal(resource) ? "official-resource" : "local-resource",
      href,
      host: isResourceExternal(resource) ? toHost(href) : undefined,
      note: resource.summary,
    });
  }

  return Array.from(new Map(sources.map((source) => [source.id, source])).values()).slice(0, 4);
}

function buildFocusCandidates(summary: LocalTopicMatchSummary, includeCommandWord = true) {
  const question = summary.questions[0];
  const revisionQuestion = summary.rankedRevisionQuestions[0]?.value;
  const schema = summary.rankedSchemas[0]?.value;
  const point = summary.curriculumPoints[0];
  const term = summary.glossaryTerms[0];
  const coverageNode = getPrimaryCoverageNode(summary);
  const rewriteCue = buildCoverageRewriteCue(summary);
  const misconceptionCue = buildMisconceptionCandidates(summary, 1)[0];
  const commandWord =
    extractCommandWord(question?.practicePrompt ?? "") ??
    extractCommandWord(revisionQuestion?.prompt ?? "") ??
    extractCommandWord(schema?.prompt ?? "") ??
    extractCommandWord(summary.query);

  const candidates = uniqueStrings([
    includeCommandWord && commandWord
      ? `Follow the command word: ${stripTrailingPunctuation(commandWord.guidance)}`
      : null,
    ...sentenceFragments(question?.expectation ?? ""),
      ...(schema?.rubricSummary ?? []),
      ...(point?.markSchemeIdeas ?? []),
      ...(coverageNode?.commandWordTargets ?? []),
      ...(coverageNode?.improvementSignals ?? []),
      rewriteCue,
      misconceptionCue ? `Avoid this confusion: ${misconceptionCue}` : null,
      ...(term ? [`Define ${term.term} accurately and keep the meaning precise.`] : []),
      ...getMarkSchemeConceptsForQuestion(question?.id ?? "")
        .flatMap((concept) => concept.conceptTargets)
        .slice(0, 4),
      "Link the idea to the system, user, or scenario in this topic.",
    "Add one example, consequence, or trade-off so the answer feels applied.",
    "Keep the explanation specific instead of generic.",
  ]);

  const cleaned = candidates
    .map((candidate) => shorten(candidate))
    .filter((candidate) => candidate.length >= 12);

  while (cleaned.length < 3) {
    cleaned.push(
      cleaned.length === 0
        ? "Define the key idea accurately."
        : cleaned.length === 1
          ? "Link it to the topic context or scenario."
          : "Add one example, consequence, or trade-off."
    );
  }

  return cleaned.slice(0, 3);
}

function buildHintLadder(summary: LocalTopicMatchSummary) {
  const focus = buildFocusCandidates(summary);
  const misconceptionCue = buildMisconceptionCandidates(summary, 1)[0];
  const commandWord =
    extractCommandWord(summary.rankedRevisionQuestions[0]?.value.prompt ?? "") ??
    extractCommandWord(summary.questions[0]?.practicePrompt ?? "") ??
    extractCommandWord(summary.query);

    return [
      commandWord
        ? `Level 1: ${commandWord.word} means ${lowerFirst(stripTrailingPunctuation(commandWord.guidance))}.`
        : "Level 1: Identify exactly what the question is testing before you write anything.",
      `Level 2: Cover these three areas: ${focus.join("; ")}.`,
      misconceptionCue
        ? `Level 3: Add one example, consequence, or trade-off, and avoid this confusion: ${lowerFirst(stripTrailingPunctuation(misconceptionCue))}.`
        : "Level 3: Add one example, consequence, or trade-off from the topic so the answer feels applied.",
      "Level 4: Skeleton plan = point -> explain -> apply. Keep it as a structure, not a finished paragraph.",
    ].join("\n");
}

function buildLocalAnswerText(summary: LocalTopicMatchSummary) {
  const term = summary.glossaryTerms[0];
  const point = summary.curriculumPoints[0];
  const question = summary.questions[0];
  const coverageNode = getPrimaryCoverageNode(summary);
  const misconceptionCue = buildMisconceptionCandidates(summary, 1)[0];
  const rewriteCue = buildCoverageRewriteCue(summary);

  const parts = uniqueStrings([
    term ? `${term.term} means ${term.definition}` : null,
    point ? `In this topic, it matters because ${lowerFirst(point.summary)}` : null,
    coverageNode?.improvementSignals[0]
      ? `A strong answer should also ${lowerFirst(coverageNode.improvementSignals[0])}`
      : null,
    misconceptionCue ? `Avoid this confusion: ${lowerFirst(stripTrailingPunctuation(misconceptionCue))}` : null,
    rewriteCue ? `Precision tip: ${rewriteCue}` : null,
    question
      ? `In exam wording, the focus is usually ${lowerFirst(stripTrailingPunctuation(question.expectation))}`
      : null,
  ]);

  if (parts.length === 0) {
    return "I can give you a topic-aligned starting point, but I do not have strong enough local evidence for this exact query yet.";
  }

  return trimWords(parts.join(". ") + ".");
}

function buildResourceAnswerText(summary: LocalTopicMatchSummary) {
  const officialResource = getAllowlistedOfficialResource(summary);
  const point = summary.curriculumPoints[0];

  if (!officialResource) {
    return "I do not have a strongly mapped allowlisted official source for this exact point, so I am falling back to the best local topic evidence instead.";
  }

  return trimWords(
      `Best first source: ${officialResource.title}. Use it to confirm the official wording, boundaries, and examples for ${point ? `${point.code} ${point.title}` : summary.topicLabel}.`
  );
}

function buildPracticeQuestionResponseText(
  drill: PracticeExamDrill,
  summary: LocalTopicMatchSummary
) {
  const misconceptionCue = buildMisconceptionCandidates(summary, 1)[0];

  return trimWords(
      `Try this next: ${drill.prompt} Plan the response first, then use the checklist to check whether your points are developed enough.${misconceptionCue ? ` Keep away from this trap: ${misconceptionCue}` : ""}`
  );
}

function findBestPracticeDrill(summary: LocalTopicMatchSummary) {
    const preferredFollowUps = new Set(getPrimaryCoverageNode(summary)?.followUpQuestionIds ?? []);

    return (
      summary.rankedDrills.find((entry) => preferredFollowUps.has(entry.value.questionId))?.value ??
      summary.rankedDrills[0]?.value ??
      getTopicPracticeBundle(summary.topicId).examDrills[0] ??
      null
    );
}

function findConfusedTerms(summary: LocalTopicMatchSummary) {
  if (!containsAny(summary.query.toLowerCase(), MISCONCEPTION_KEYWORDS)) {
    return [];
  }

  return summary.glossaryTerms.slice(0, 2);
}

function buildContrastSentence(summary: LocalTopicMatchSummary) {
  const terms = findConfusedTerms(summary);
  const misconceptionSignal = summary.coverageNodes[0]?.misconceptionSignals[0];
  if (terms.length < 2) {
    return misconceptionSignal
      ? trimWords(
          `Common confusion to avoid: ${lowerFirst(misconceptionSignal)}. Keep the terms separate and explain why each one matters in context.`
        )
      : null;
  }

  const [first, second] = terms;
  return trimWords(
    `${first.term} is not ${second.term} because ${lowerFirst(first.definition)}. ${second.term} instead means ${lowerFirst(second.definition)}.`
  );
}

function parseGroundedSections(answer: string) {
  const directMatch = answer.match(/Direct answer:\s*([\s\S]*?)(?:\n[A-Z][^:\n]+:|$)/i);
  const focusMatch = answer.match(/Exam-safe focus:\s*([\s\S]*?)(?:\n[A-Z][^:\n]+:|$)/i);
  const limitsMatch = answer.match(/Limits:\s*([\s\S]*?)$/i);

  const directAnswer = directMatch?.[1]?.trim() ?? answer.trim();
  const focusSection = focusMatch?.[1]?.trim() ?? "";
  const limits = limitsMatch?.[1]?.trim() ?? "";
  const focusLines = focusSection
    .split("\n")
    .map((line) => line.replace(/^[-*\u2022]\s*/, "").trim())
    .filter(Boolean);

  return {
    directAnswer,
    examSafeFocus: focusLines,
    limits,
  };
}

function buildGroundedSources(grounded: GroundedResearchResponse): TopicIntelligenceSource[] {
  return grounded.sources
    .filter((source) => isOfficialGroundedHost(source.host))
    .map((source) => ({
      id: `${source.index}-${source.host}`,
      title: source.title,
      type: "grounded-web" as const,
      href: source.uri,
      host: source.host,
    }));
}

function buildAnswerCheckSuggestion(summary: LocalTopicMatchSummary): TopicIntelligenceNextAction {
  const question = summary.rankedRevisionQuestions[0]?.value;
  if (!question) {
    return buildAction("Open exam questions", `/revision/${summary.topicId}/exam-questions`, "route");
  }

  return buildAction(
    "Open exam questions",
    toRevisionQuestionHref(summary.topicId, question.id),
    "route"
  );
}

async function buildGroundedOrFallbackResponse(
  request: TopicIntelligenceRequest,
  summary: LocalTopicMatchSummary,
  baseIntent: TopicIntelligenceIntent,
  deps: TopicIntelligenceDependencies
): Promise<TopicIntelligenceResponse | null> {
  const groundedResolver =
    deps.groundedResolver ??
    ((value: TopicIntelligenceRequest) =>
      generateGroundedResearchAnswer({
        topicId: value.topicId,
        query: value.query,
      }));

  try {
    const grounded = await groundedResolver(request);
    const officialSources = buildGroundedSources(grounded);

    if (officialSources.length === 0) {
      return null;
    }

    const sections = parseGroundedSections(grounded.answer);

    return {
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      provider: "gemini-grounded",
      model: grounded.model,
      topicId: request.topicId,
      query: request.query,
      intent: "grounded-answer",
      confidence: "high",
      confidenceScore: Math.max(summary.confidenceScore, 28),
      answer: trimWords(
        `${sections.directAnswer}${sections.limits ? ` Note: ${sections.limits}` : ""}`
      ),
      examSafeFocus: uniqueStrings([
        ...sections.examSafeFocus,
        ...buildFocusCandidates(summary, false),
      ]).slice(0, 3),
      misconceptions: [],
      suggestedNextAction:
        officialSources[0]?.href
          ? buildAction("Open official source", officialSources[0].href, "external")
          : buildAnswerCheckSuggestion(summary),
      sources: officialSources,
      relatedQuestions: toRelatedQuestions(summary),
      relatedResources: toRelatedResources(summary.resources),
      officialConfirmationStatus: "confirmed",
      localOnly: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grounded search unavailable.";

    return {
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      provider: "local-rule-engine",
      topicId: request.topicId,
      query: request.query,
      intent: baseIntent === "resource-pick" ? "resource-pick" : "local-answer",
      confidence: summary.confidence,
      confidenceScore: summary.confidenceScore,
      answer: trimWords(
        `${buildLocalAnswerText(summary)} ${
          message.startsWith("Missing GEMINI_API_KEY")
            ? "Official confirmation is unavailable right now because grounded web search is not configured on the server."
            : "I could not complete official confirmation right now, so I am giving the best local topic answer instead."
        }`
      ),
      examSafeFocus: buildFocusCandidates(summary),
      misconceptions: [],
      suggestedNextAction:
        baseIntent === "resource-pick"
          ? buildAction("Open topic resources", `/revision/${summary.topicId}/resources`, "route")
          : buildAction("Open past papers", toPaperPromptsHref(summary.topicId), "route"),
      sources: buildLocalSources(summary),
      relatedQuestions: toRelatedQuestions(summary),
      relatedResources: toRelatedResources(summary.resources),
      officialConfirmationStatus: message.startsWith("Missing GEMINI_API_KEY")
        ? "unavailable"
        : "not-found",
      localOnly: true,
    };
  }
}

function shouldUseGeminiCoach(
  response: TopicIntelligenceResponse,
  summary: LocalTopicMatchSummary
) {
  if (summary.confidence === "low") {
    return false;
  }

  return (
    response.intent === "hint" ||
    response.intent === "local-answer" ||
    response.intent === "misconception-fix"
  );
}

async function maybeEnhanceWithGeminiCoach(
  request: TopicIntelligenceRequest,
  summary: LocalTopicMatchSummary,
  response: TopicIntelligenceResponse,
  deps: TopicIntelligenceDependencies
) {
  if (!shouldUseGeminiCoach(response, summary)) {
    return withLocalProvider(response);
  }

  const coachResolver = deps.coachResolver ?? generateGeminiCoachResponse;

  try {
    const coached = await coachResolver({
      topicId: request.topicId,
      query: request.query,
      intent: response.intent,
      localDraftAnswer: response.answer,
      localExamSafeFocus: response.examSafeFocus,
      localMisconceptions: response.misconceptions,
      draftAnswer: request.draftAnswer,
    });

    if (coached.outOfScope) {
      return withLocalProvider(response);
    }

    return {
      ...response,
      provider: coached.provider,
      model: coached.model,
      answer: coached.answer || response.answer,
      examSafeFocus:
        coached.examSafeFocus.length === 3
          ? coached.examSafeFocus
          : response.examSafeFocus,
      misconceptions:
        coached.misconceptions.length <= 2
          ? coached.misconceptions
          : response.misconceptions,
    };
  } catch {
    return withLocalProvider(response);
  }
}

function buildLocalResponse(
  request: TopicIntelligenceRequest,
  summary: LocalTopicMatchSummary,
  intent: TopicIntelligenceIntent
): TopicIntelligenceResponse {
  const relatedQuestions = toRelatedQuestions(summary);
  const relatedResources = toRelatedResources(summary.resources);
  const sources = buildLocalSources(summary);
  const drill = findBestPracticeDrill(summary);
  const officialResource = getAllowlistedOfficialResource(summary);
  const officialHref = officialResource ? getResourceHref(officialResource) : undefined;
  const confusedTermsSentence = buildContrastSentence(summary);
  const misconceptionHints = buildMisconceptionCandidates(summary);

  if (intent === "hint") {
    return withLocalProvider({
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      topicId: request.topicId,
      query: request.query,
      intent,
      confidence: summary.confidence,
      confidenceScore: summary.confidenceScore,
      answer: buildHintLadder(summary),
      examSafeFocus: buildFocusCandidates(summary),
      misconceptions: misconceptionHints,
      suggestedNextAction:
        drill
          ? buildAction("Try a practice question", toExamDrillHref(summary.topicId, drill.id), "route")
          : buildAction("Open past papers", toPaperPromptsHref(summary.topicId), "route"),
      sources,
      relatedQuestions,
      relatedResources,
      officialConfirmationStatus: "not-needed",
      localOnly: true,
    });
  }

  if (intent === "resource-pick") {
    return withLocalProvider({
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      topicId: request.topicId,
      query: request.query,
      intent,
      confidence: summary.confidence,
      confidenceScore: summary.confidenceScore,
      answer: buildResourceAnswerText(summary),
      examSafeFocus: buildFocusCandidates(summary, false),
      misconceptions: misconceptionHints,
      suggestedNextAction:
        officialHref
          ? buildAction("Open official source", officialHref, "external")
          : buildAction("Open topic resources", `/revision/${summary.topicId}/resources`, "route"),
      sources,
      relatedQuestions,
      relatedResources,
      officialConfirmationStatus: officialHref ? "confirmed" : "not-found",
      localOnly: true,
    });
  }

  if (intent === "practice-question" && drill) {
    return withLocalProvider({
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      topicId: request.topicId,
      query: request.query,
      intent,
      confidence: summary.confidence === "low" ? "medium" : summary.confidence,
      confidenceScore: Math.max(summary.confidenceScore, 16),
      answer: buildPracticeQuestionResponseText(drill, summary),
      examSafeFocus: uniqueStrings([
        ...drill.checklist,
        ...buildFocusCandidates(summary, false),
      ]).slice(0, 3),
      misconceptions: misconceptionHints,
      suggestedNextAction: buildAction(
        "Open exam drill",
        toExamDrillHref(summary.topicId, drill.id),
        "route"
      ),
      sources,
      relatedQuestions,
      relatedResources,
      officialConfirmationStatus: "not-needed",
      localOnly: true,
    });
  }

  if (intent === "misconception-fix") {
    return withLocalProvider({
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      topicId: request.topicId,
      query: request.query,
      intent,
      confidence: summary.confidence,
      confidenceScore: summary.confidenceScore,
      answer:
        confusedTermsSentence ??
        trimWords(
          "Tighten the distinction before you memorise it. Use the topic terms accurately, then explain why they are different in a DSD context."
        ),
      examSafeFocus: buildFocusCandidates(summary),
      misconceptions:
        misconceptionHints.length > 0
          ? misconceptionHints
          : confusedTermsSentence
            ? [
                "Do not treat similar technical terms as interchangeable.",
                "Show why each term matters in context instead of listing both loosely.",
              ]
            : ["Clarify the distinction before writing a full answer."],
      suggestedNextAction:
        drill
          ? buildAction("Try a practice question", toExamDrillHref(summary.topicId, drill.id), "route")
          : buildAction("Open exam questions", `/revision/${summary.topicId}/exam-questions`, "route"),
      sources,
      relatedQuestions,
      relatedResources,
      officialConfirmationStatus: "not-needed",
      localOnly: true,
    });
  }

  return withLocalProvider({
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "topic-assistant",
    topicId: request.topicId,
    query: request.query,
    intent,
    confidence: summary.confidence,
    confidenceScore: summary.confidenceScore,
    answer: buildLocalAnswerText(summary),
    examSafeFocus: buildFocusCandidates(summary),
    misconceptions: misconceptionHints,
    suggestedNextAction:
      summary.confidence === "medium" && officialHref
        ? buildAction("Open official source", officialHref, "external")
        : buildAnswerCheckSuggestion(summary),
    sources,
    relatedQuestions,
    relatedResources,
    officialConfirmationStatus: "not-needed",
    localOnly: true,
  });
}

function buildAnswerCheckResponse(
  request: TopicIntelligenceRequest,
  summary: LocalTopicMatchSummary
): TopicIntelligenceResponse {
  const draftAnswer = request.draftAnswer?.trim() ?? "";
  const schema = summary.rankedSchemas[0]?.value ?? null;
  const relatedQuestions = toRelatedQuestions(summary);
  const relatedResources = toRelatedResources(summary.resources);
  const sources = buildLocalSources(summary);
  const suggestedNextAction = buildAnswerCheckSuggestion(summary);
  const misconceptionHints = buildMisconceptionCandidates(summary);

  if (!schema || draftAnswer.length < 8) {
    return withLocalProvider({
      evaluationVersion: 1,
      evaluatedAt: new Date().toISOString(),
      mode: "topic-assistant",
      topicId: request.topicId,
      query: request.query,
      intent: "answer-check",
      confidence: summary.confidence,
      confidenceScore: summary.confidenceScore,
      answer: trimWords(
        "I can route this into the deterministic answer checker, but I need a short written draft or a closer matching prompt first."
      ),
      examSafeFocus: buildFocusCandidates(summary),
      misconceptions: misconceptionHints,
      suggestedNextAction,
      sources,
      relatedQuestions,
      relatedResources,
      officialConfirmationStatus: "not-needed",
      localOnly: true,
    });
  }

  const evaluation = evaluateRevisionAnswerWithSchema(schema, draftAnswer);
  const strongestMisconception = evaluation.misconceptionBreakdown[0];
  const missingTargets = evaluation.missingConcepts.slice(0, 3);
  const rewriteCue = buildCoverageRewriteCue(summary);
  const answer = strongestMisconception
    ? trimWords(
        `Best matched rubric: ${shorten(schema.prompt, 90)}. Main correction: ${strongestMisconception.label}. ${strongestMisconception.explanation}${rewriteCue ? ` Precision cue: ${rewriteCue}` : ""}`
      )
    : trimWords(
        `Best matched rubric: ${shorten(schema.prompt, 90)}. Your draft currently covers ${evaluation.matchedConcepts.length} of ${evaluation.conceptBreakdown.length} marking ideas. Tighten the missing coverage before you submit it again.`
      );

  return withLocalProvider({
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "topic-assistant",
    topicId: request.topicId,
    query: request.query,
    intent: strongestMisconception ? "misconception-fix" : "answer-check",
    confidence: summary.confidence,
    confidenceScore: Math.max(summary.confidenceScore, 16),
    answer,
    examSafeFocus: uniqueStrings([
      ...missingTargets,
      ...buildFocusCandidates(summary, false),
    ]).slice(0, 3),
    misconceptions: uniqueStrings([
      ...(strongestMisconception
        ? evaluation.misconceptionBreakdown
            .slice(0, 2)
            .map((item) => `${item.label}: ${item.explanation}`)
        : []),
      ...misconceptionHints,
    ]).slice(0, 2),
    suggestedNextAction,
    sources,
    relatedQuestions,
    relatedResources,
    officialConfirmationStatus: "not-needed",
    localOnly: true,
  });
}

export async function generateTopicIntelligenceResponse(
  request: TopicIntelligenceRequest,
  deps: TopicIntelligenceDependencies = {}
): Promise<TopicIntelligenceResponse> {
  const topicId = request.topicId.trim();
  if (!topicId) {
    throw new Error("Topic id is required.");
  }

  const topic = getTopicById(topicId);
  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  const query = getBestTopicQuery(topicId, request.query);
  const resolvedRequest: TopicIntelligenceRequest = {
    ...request,
    topicId,
    query,
  };
  const summary = buildLocalMatchSummary(topicId, query);
  const detectedIntent = detectTopicIntelligenceIntent(resolvedRequest);
  const shouldFixMisconception =
    detectedIntent !== "answer-check" &&
    containsAny(query.toLowerCase(), MISCONCEPTION_KEYWORDS) &&
    (
      summary.glossaryTerms.length >= 2 ||
      summary.coverageNodes.some((node) => node.misconceptionSignals.length > 0)
    );
  const needsGroundedConfirmation =
    detectedIntent === "grounded-answer" ||
    (
      summary.confidence === "low" &&
      detectedIntent !== "practice-question" &&
      detectedIntent !== "hint"
    ) ||
    (detectedIntent === "resource-pick" && !getAllowlistedOfficialResource(summary));

  if (detectedIntent === "answer-check") {
    return buildAnswerCheckResponse(resolvedRequest, summary);
  }

  if (shouldFixMisconception) {
    return maybeEnhanceWithGeminiCoach(
      resolvedRequest,
      summary,
      buildLocalResponse(resolvedRequest, summary, "misconception-fix"),
      deps
    );
  }

  if (needsGroundedConfirmation) {
    const grounded = await buildGroundedOrFallbackResponse(
      resolvedRequest,
      summary,
      detectedIntent,
      deps
    );

    if (grounded) {
      return grounded;
    }

    const fallback = buildLocalResponse(
      resolvedRequest,
      summary,
      detectedIntent === "resource-pick" ? "resource-pick" : "local-answer"
    );

    return {
      ...fallback,
      answer: trimWords(
        `${fallback.answer} Official confirmation was not found in an allowlisted Pearson or T Levels source.`
      ),
      officialConfirmationStatus: "not-found",
    };
  }

  return maybeEnhanceWithGeminiCoach(
    resolvedRequest,
    summary,
    buildLocalResponse(resolvedRequest, summary, detectedIntent),
    deps
  );
}
