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
  | "ask"
  | "practice"
  | "exam-conditions"
  | "recall"
  | "exam-drill"
  | "answer-check"
  | "quiz"
  | "exam-questions"
  | "resources"
  | "progress";

type TopicRouteNavMode =
  | "overview"
  | "practice"
  | "exam-conditions"
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
    label: "Quick Q/A",
    href: "/revision/quick-quiz",
    description: "Simple revision across mixed topics",
  },
  { id: "paper-1", label: "Paper 1", href: "/revision/paper-1", description: "Simple revision theory route" },
  { id: "paper-2", label: "Paper 2", href: "/revision/paper-2", description: "Simple revision applied route" },
  {
    id: "mixed",
    label: "Mixed",
    href: "/revision/mixed",
    description: "Questions from both papers",
  },
  { id: "progress", label: "Progress", href: "/revision/progress" },
];

export const TOPIC_ROUTE_ITEMS: Array<{
  id: TopicRouteNavMode;
  label: string;
  description?: string;
}> = [
  { id: "overview", label: "Overview", description: "What this topic covers" },
  { id: "practice", label: "Simple revision", description: "Ask coach, recall, and quick Q/A" },
  {
    id: "exam-conditions",
    label: "Exam conditions",
    description: "Separate full-screen exam mode with timer and final marking",
  },
  { id: "exam-questions", label: "Exam questions", description: "Past-style prompts" },
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

export function getTopicNavMode(mode: TopicLearningMode): TopicRouteNavMode {
  if (mode === "ask" || mode === "recall" || mode === "quiz" || mode === "practice") {
    return "practice";
  }

  if (mode === "exam-drill" || mode === "answer-check" || mode === "exam-conditions") {
    return "exam-conditions";
  }

  return mode;
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

