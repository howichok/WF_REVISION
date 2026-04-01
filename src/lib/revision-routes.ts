export type RevisionRouteId =
  | "hub"
  | "diagnostic"
  | "weak-areas"
  | "topics"
  | "quick-quiz"
  | "paper-1"
  | "paper-2"
  | "mixed"
  | "progress";

export type TopicLearningMode =
  | "overview"
  | "practice"
  | "recall"
  | "exam-drill"
  | "answer-check"
  | "quiz"
  | "exam-questions"
  | "resources"
  | "progress";

export const REVISION_ROUTE_ITEMS: Array<{
  id: RevisionRouteId;
  label: string;
  href: string;
  description?: string;
}> = [
  {
    id: "hub",
    label: "Start",
    href: "/revision",
    description: "Revision home and learning path",
  },
  {
    id: "diagnostic",
    label: "Diagnostic",
    href: "/revision/diagnostic",
    description: "Find your baseline across topics",
  },
  {
    id: "weak-areas",
    label: "Weak areas",
    href: "/revision/weak-areas",
    description: "Focus on topics that need work",
  },
  { id: "topics", label: "Topics", href: "/revision/topics", description: "Browse by topic" },
  {
    id: "quick-quiz",
    label: "Quiz",
    href: "/revision/quick-quiz",
    description: "Mixed quick checks",
  },
  { id: "paper-1", label: "Paper 1", href: "/revision/paper-1" },
  { id: "paper-2", label: "Paper 2", href: "/revision/paper-2" },
  {
    id: "mixed",
    label: "Mixed",
    href: "/revision/mixed",
    description: "Questions from both papers",
  },
  { id: "progress", label: "Progress", href: "/revision/progress" },
];

export const TOPIC_ROUTE_ITEMS: Array<{
  id: TopicLearningMode;
  label: string;
  description?: string;
}> = [
  { id: "overview", label: "Overview", description: "What this topic covers" },
  { id: "recall", label: "Recall", description: "Quick retrieval of key ideas" },
  { id: "practice", label: "Practice", description: "Guided questions and checks" },
  {
    id: "answer-check",
    label: "Answer check",
    description: "Written answers against a mark-style scheme",
  },
  { id: "exam-questions", label: "Exam questions", description: "Past-style prompts" },
  { id: "exam-drill", label: "Exam drill", description: "Timed exam-style run" },
  { id: "quiz", label: "Quiz", description: "Topic quiz" },
  { id: "resources", label: "Resources", description: "Notes and references" },
  { id: "progress", label: "Progress", description: "Your progress in this topic" },
];

export function getTopicRouteHref(topicId: string, mode: TopicLearningMode) {
  return `/revision/${topicId}/${mode}`;
}

export function getTopicRouteItems(topicId: string) {
  return TOPIC_ROUTE_ITEMS.map((item) => ({
    ...item,
    href: getTopicRouteHref(topicId, item.id),
  }));
}

export function mapLegacyTopicTabToRoute(topicId: string, tab?: string | null) {
  switch (tab) {
    case "practice":
      return getTopicRouteHref(topicId, "practice");
    case "exam-questions":
      return getTopicRouteHref(topicId, "exam-questions");
    case "progress":
      return getTopicRouteHref(topicId, "progress");
    case "key-terms":
    case "subtopics":
    case "weak-areas":
    case "overview":
    case undefined:
    case null:
      return getTopicRouteHref(topicId, "overview");
    default:
      return getTopicRouteHref(topicId, "overview");
  }
}

