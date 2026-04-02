import {
  getGeneratedPointQuestions,
  getResourceHref,
  getTopicContentBundle,
  getTopicCoverageGraph,
  isResourceExternal,
} from "@/lib/content";
import { normalizeText } from "@/lib/intelligence/normalize";
import { getTopicById } from "@/lib/types";
import type { TopicId } from "@/lib/types";

export interface TopicMaterialPack {
  topic: NonNullable<ReturnType<typeof getTopicById>>;
  materialPack: string;
}

function getRelevantTokens(seed: string) {
  return Array.from(
    new Set(normalizeText(seed).tokens.filter((token) => token.length > 2))
  );
}

function scoreRelevance(seedTokens: string[], values: Array<string | undefined>) {
  if (seedTokens.length === 0) {
    return 0;
  }

  const candidateTokens = new Set(
    values.flatMap((value) => normalizeText(value ?? "").tokens)
  );

  let score = 0;
  for (const token of seedTokens) {
    if (!candidateTokens.has(token)) {
      continue;
    }

    score += token.length >= 6 ? 4 : 2;
  }

  return score;
}

function rankByRelevance<T>(
  items: T[],
  seedTokens: string[],
  getValues: (item: T) => Array<string | undefined>
) {
  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreRelevance(seedTokens, getValues(item)),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.item);
}

export function buildTopicMaterialPack(topicId: string): TopicMaterialPack {
  const topic = getTopicById(topicId);
  const bundle = getTopicContentBundle(topicId);
  const coverageGraph = getTopicCoverageGraph(topicId);
  const generatedQuestions = getGeneratedPointQuestions()
    .filter((question) => question.legacyTopicIds.includes(topicId as TopicId))
    .slice(0, 8)
    .map((question) => `- ${question.title}: ${question.practicePrompt}`)
    .join("\n");

  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  const officialPoints = bundle.officialPoints
    .slice(0, 8)
    .map((point) => `- ${point.code}: ${point.title}. ${point.summary}`)
    .join("\n");
  const glossary = bundle.terms
    .slice(0, 12)
    .map((term) => `- ${term.term}: ${term.definition}`)
    .join("\n");
  const examSignals = bundle.questions
    .slice(0, 8)
    .map((question) => `- ${question.title}: ${question.practicePrompt}`)
    .join("\n");
  const officialResources = bundle.resources
    .filter((resource) => isResourceExternal(resource) && Boolean(getResourceHref(resource)))
    .slice(0, 6)
    .map((resource) => `- ${resource.title}: ${getResourceHref(resource)}`)
    .join("\n");
  const coverageSummary = coverageGraph
    ? [
        `Covered official points: ${coverageGraph.coverageByPoint.length}`,
        `Generated point-based prompts: ${coverageGraph.generatedQuestionCount}`,
        `Related terms: ${coverageGraph.relatedTerms.slice(0, 10).join(", ")}`,
      ].join("\n")
    : null;

  return {
    topic,
    materialPack: [
      `Topic: ${topic.label}`,
      bundle.mapping?.note ? `Curriculum mapping note: ${bundle.mapping.note}` : null,
      coverageSummary ? `Coverage graph:\n${coverageSummary}` : null,
      officialPoints ? `Official curriculum points:\n${officialPoints}` : null,
      glossary ? `Key glossary:\n${glossary}` : null,
      examSignals ? `Mapped exam prompts:\n${examSignals}` : null,
      generatedQuestions ? `Generated point-based prompts:\n${generatedQuestions}` : null,
      officialResources ? `Priority official resources:\n${officialResources}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export function buildCompactTopicMaterialPack(
  topicId: string,
  questionPrompt: string
): TopicMaterialPack {
  const topic = getTopicById(topicId);
  const bundle = getTopicContentBundle(topicId);
  const coverageGraph = getTopicCoverageGraph(topicId);

  if (!topic) {
    throw new Error(`Unknown topic: ${topicId}`);
  }

  const relevantTokens = getRelevantTokens(questionPrompt);
  const rankedCoverageNodes = rankByRelevance(
    coverageGraph?.coverageByPoint ?? [],
    relevantTokens,
    (node) => [
      node.pointTitle,
      node.relatedConcepts.join(" "),
      node.commandWordTargets.join(" "),
      node.improvementSignals.join(" "),
      node.misconceptionSignals.join(" "),
    ]
  );
  const priorityPointIds = new Set(
    rankedCoverageNodes.slice(0, 2).map((node) => node.pointId)
  );

  const officialPoints = rankByRelevance(
    bundle.officialPoints,
    relevantTokens,
    (point) => [point.title, point.summary, point.relatedTerms.join(" ")]
  )
    .filter((point) => priorityPointIds.size === 0 || priorityPointIds.has(point.id))
    .slice(0, 2)
    .map((point) => `- ${point.code}: ${point.title}. ${point.summary}`)
    .join("\n");

  const glossary = rankByRelevance(
    bundle.terms,
    relevantTokens,
    (term) => [term.term, term.definition, term.aliases?.join(" ")]
  )
    .filter(
      (term) =>
        priorityPointIds.size === 0 ||
        term.curriculumPointIds.some((pointId) => priorityPointIds.has(pointId))
    )
    .slice(0, 4)
    .map((term) => `- ${term.term}: ${term.definition}`)
    .join("\n");

  const officialResources = rankByRelevance(
    bundle.resources.filter(
      (resource) => isResourceExternal(resource) && Boolean(getResourceHref(resource))
    ),
    relevantTokens,
    (resource) => [resource.title, resource.summary, resource.tags.join(" ")]
  )
    .filter(
      (resource) =>
        priorityPointIds.size === 0 ||
        resource.curriculumPointIds.some((pointId) => priorityPointIds.has(pointId))
    )
    .slice(0, 2)
    .map((resource) => `- ${resource.title}: ${resource.summary}`)
    .join("\n");

  return {
    topic,
    materialPack: [
      `Topic: ${topic.label}`,
      `Question boundary: ${questionPrompt}`,
      officialPoints ? `Relevant curriculum points:\n${officialPoints}` : null,
      glossary ? `Useful terms:\n${glossary}` : null,
      officialResources ? `Priority sources:\n${officialResources}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
