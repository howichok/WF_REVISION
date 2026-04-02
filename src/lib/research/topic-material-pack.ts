import {
  getGeneratedPointQuestions,
  getResourceHref,
  getTopicContentBundle,
  getTopicCoverageGraph,
  isResourceExternal,
} from "@/lib/content";
import { getTopicById } from "@/lib/types";
import type { TopicId } from "@/lib/types";

export interface TopicMaterialPack {
  topic: NonNullable<ReturnType<typeof getTopicById>>;
  materialPack: string;
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
