import type { TopicId } from "@/lib/types";
import { DSD_CURRICULUM_POINTS } from "./curriculum";
import { GLOSSARY_TERMS } from "./glossary";
import { LEGACY_TOPIC_MAPPINGS } from "./mappings";
import type {
  CoverageQuestionVariant,
  CurriculumPoint,
  QuestionMetadata,
} from "./types";

const GENERATED_SOURCE_LABEL = "Official point question factory";
const PRIORITY_CURATED_TOPICS: TopicId[] = [
  "intro-programming",
  "business",
  "digital-environments",
];

const UNIVERSAL_CURATED_VARIANTS: CoverageQuestionVariant[] = [
  "evaluate-tradeoff",
  "fix-misconception",
];

const FALLBACK_TOPICS_BY_AREA_CODE: Record<string, TopicId[]> = {
  "1": ["problem-solving", "business", "esp"],
  "2": ["legislation", "security", "emerging-issues"],
  "3": ["data", "business", "problem-solving"],
  "4": ["problem-solving", "data", "digital-environments", "intro-programming"],
  "5": ["business", "digital-environments"],
  "6": ["intro-programming", "business", "data", "digital-environments", "security"],
  "7": ["digital-environments", "intro-programming", "problem-solving", "security"],
  "8": ["business", "security", "esp", "emerging-issues"],
};

const TOPIC_SCENARIOS: Record<
  TopicId,
  {
    product: string;
    organisation: string;
    userGroup: string;
  }
> = {
  "problem-solving": {
    product: "a school attendance app",
    organisation: "a sixth-form provider",
    userGroup: "students and support staff",
  },
  "intro-programming": {
    product: "an appointment booking service",
    organisation: "a local clinic",
    userGroup: "end users and administrators",
  },
  "emerging-issues": {
    product: "a public digital service",
    organisation: "a large organisation adopting new technology",
    userGroup: "citizens and staff",
  },
  legislation: {
    product: "a customer portal storing personal data",
    organisation: "a regulated organisation",
    userGroup: "customers and compliance staff",
  },
  business: {
    product: "a growing subscription platform",
    organisation: "a software business",
    userGroup: "customers and internal teams",
  },
  data: {
    product: "a customer analytics dashboard",
    organisation: "a data-driven company",
    userGroup: "analysts and decision-makers",
  },
  "digital-environments": {
    product: "a distributed web application",
    organisation: "a remote software team",
    userGroup: "developers and end users",
  },
  security: {
    product: "a healthcare records system",
    organisation: "a security-conscious organisation",
    userGroup: "staff handling sensitive information",
  },
  esp: {
    product: "an employer-set project solution",
    organisation: "a client organisation",
    userGroup: "the client and target users",
  },
};

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
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

function uniqueTopicIds(values: TopicId[]) {
  return [...new Set(values)] as TopicId[];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getTopicsForPoint(point: CurriculumPoint) {
  const explicitTopics = LEGACY_TOPIC_MAPPINGS.filter((mapping) =>
    mapping.officialPointIds.includes(point.id)
  ).map((mapping) => mapping.topicId);

  if (explicitTopics.length > 0) {
    return uniqueTopicIds(explicitTopics);
  }

  return uniqueTopicIds(FALLBACK_TOPICS_BY_AREA_CODE[point.areaCode] ?? ["esp"]);
}

function getPrimaryTopicId(topicIds: TopicId[]) {
  return topicIds.find((topicId) => topicId !== "esp") ?? topicIds[0] ?? "esp";
}

function getTermsForPoint(pointId: string) {
  return GLOSSARY_TERMS.filter((term) => term.curriculumPointIds.includes(pointId)).map(
    (term) => term.term
  );
}

function getQuestionTypeForVariant(variant: CoverageQuestionVariant): QuestionMetadata["questionType"] {
  switch (variant) {
    case "core-explain":
      return "short-open";
    case "scenario-apply":
    case "compare-justify":
    case "design-decision":
    case "fix-misconception":
      return "medium-open";
    case "risk-priority":
      return "scenario";
    case "evaluate-tradeoff":
    case "evaluate-impact":
      return "extended-response";
    default:
      return "medium-open";
  }
}

function getMarksForVariant(variant: CoverageQuestionVariant) {
  switch (variant) {
    case "core-explain":
      return 3;
    case "scenario-apply":
    case "compare-justify":
    case "design-decision":
    case "fix-misconception":
      return 4;
    case "risk-priority":
      return 5;
    case "evaluate-tradeoff":
    case "evaluate-impact":
      return 6;
    default:
      return 4;
  }
}

function buildExpectation(
  point: CurriculumPoint,
  terms: string[],
  variant: CoverageQuestionVariant
) {
  const ideas = point.markSchemeIdeas.slice(0, 2).map((idea) => stripTrailingPunctuation(idea));
  const termNote =
    terms.length > 0
      ? `Use terms such as ${terms.slice(0, 2).join(" and ")} accurately.`
      : "Use the key technical vocabulary accurately.";

  switch (variant) {
    case "core-explain":
      return compactText(
        `Strong answers define ${lowerFirst(point.title)} clearly, ${lowerFirst(
          ideas[0] ?? "link the point to software development"
        )}, and ${termNote}`
      );
    case "scenario-apply":
      return compactText(
        `Strong answers apply ${lowerFirst(point.title)} to the scenario, explain one concrete decision, and ${lowerFirst(
          ideas[0] ?? "link the decision to user, system, or project impact"
        )}.`
      );
    case "compare-justify":
      return compactText(
        `Strong answers justify the decision with trade-offs, ${lowerFirst(
          ideas[0] ?? "show why the choice fits the context"
        )}, and ${lowerFirst(ideas[1] ?? termNote)}`
      );
    case "evaluate-impact":
      return compactText(
        `Strong answers evaluate what could go wrong if ${lowerFirst(
          point.title
        )} is ignored, then balance risk, quality, or user impact before reaching a judgement.`
      );
    case "design-decision":
      return compactText(
        `Strong answers choose one realistic design, implementation, or environment decision linked to ${lowerFirst(
          point.title
        )}, justify why it fits the scenario, and explain what it improves for delivery, quality, or maintainability.`
      );
    case "risk-priority":
      return compactText(
        `Strong answers identify the highest-priority risk or constraint around ${lowerFirst(
          point.title
        )}, justify why it should be addressed first, and explain the consequence of ignoring it.`
      );
    case "evaluate-tradeoff":
      return compactText(
        `Strong answers weigh a realistic trade-off around ${lowerFirst(
          point.title
        )}, justify which side matters most in context, and link the judgement to delivery, quality, or business impact.`
      );
    case "fix-misconception":
      return compactText(
        `Strong answers correct a common misunderstanding about ${lowerFirst(
          point.title
        )}, replace vague wording with precise terminology, and show what the learner should say instead.`
      );
    default:
      return compactText(point.summary);
  }
}

function buildSummary(point: CurriculumPoint, variant: CoverageQuestionVariant) {
  switch (variant) {
    case "core-explain":
      return `Generated coverage prompt for the core idea behind ${point.code} ${point.title}.`;
    case "scenario-apply":
      return `Generated scenario prompt applying ${point.code} ${point.title} to a realistic software context.`;
    case "compare-justify":
      return `Generated justify-or-compare prompt for ${point.code} ${point.title}.`;
    case "evaluate-impact":
      return `Generated evaluation prompt asking what happens if ${point.code} ${point.title} is ignored.`;
    case "design-decision":
      return `Generated design-decision prompt for ${point.code} ${point.title}.`;
    case "risk-priority":
      return `Generated risk-priority prompt for ${point.code} ${point.title}.`;
    case "evaluate-tradeoff":
      return `Generated trade-off prompt for ${point.code} ${point.title}.`;
    case "fix-misconception":
      return `Generated misconception-fix prompt for ${point.code} ${point.title}.`;
    default:
      return point.summary;
  }
}

function buildPrompt(
  point: CurriculumPoint,
  topicId: TopicId,
  terms: string[],
  variant: CoverageQuestionVariant
) {
  const scenario = TOPIC_SCENARIOS[topicId];
  const conceptA = point.relatedConcepts[0] ?? terms[0] ?? "quality";
  const conceptB = point.relatedConcepts[1] ?? terms[1] ?? "risk";
  const normalizedTitle = point.title.toLowerCase();
  const likelyDecision =
    normalizedTitle.includes("validation")
      ? "a validation and error-handling approach"
      : normalizedTitle.includes("testing")
        ? "a testing strategy"
        : normalizedTitle.includes("cloud")
          ? "a cloud deployment model"
          : normalizedTitle.includes("virtual")
            ? "a virtualisation setup"
            : normalizedTitle.includes("network")
              ? "a network design choice"
              : normalizedTitle.includes("change")
                ? "a rollout plan"
                : normalizedTitle.includes("business")
                  ? "a business-facing implementation choice"
                  : "a technical design decision";
  const likelyRisk =
    normalizedTitle.includes("validation")
      ? "invalid input causing incorrect processing"
      : normalizedTitle.includes("testing")
        ? "faults reaching live users"
        : normalizedTitle.includes("cloud")
          ? "loss of control or avoidable cost"
          : normalizedTitle.includes("virtual")
            ? "resource contention or management overhead"
            : normalizedTitle.includes("network")
              ? "downtime or poor connectivity"
              : normalizedTitle.includes("change")
                ? "user disruption during rollout"
                : normalizedTitle.includes("business")
                  ? "operational disruption or resistance to change"
                  : "delivery risk in the project";

  switch (variant) {
    case "core-explain":
      return (
        point.practicePrompts[0] ??
        `Explain ${lowerFirst(point.title)} in a software development context.`
      );
    case "scenario-apply":
      return `A team is building ${scenario.product} for ${scenario.organisation}. Explain how ${lowerFirst(
        point.title
      )} should influence one project, design, or implementation decision.`;
    case "compare-justify":
      if (point.relatedConcepts.length >= 2 || terms.length >= 2) {
        return `Compare ${conceptA} and ${conceptB} when applying ${lowerFirst(
          point.title
        )} to ${scenario.product}. Which should the team focus on first and why?`;
      }

      return `Justify one important decision a team should make because of ${lowerFirst(
        point.title
      )} while building ${scenario.product}.`;
    case "evaluate-impact":
      return `Evaluate what could go wrong for ${scenario.organisation} if a team ignores ${lowerFirst(
        point.title
      )} while delivering ${scenario.product} for ${scenario.userGroup}.`;
    case "design-decision":
      return `A team is building ${scenario.product} for ${scenario.organisation}. Choose and justify ${likelyDecision} that should be made because of ${lowerFirst(
        point.title
      )}.`;
    case "risk-priority":
      return `While delivering ${scenario.product}, a team is worried about ${likelyRisk}. Explain why this should be treated as the highest priority when applying ${lowerFirst(
        point.title
      )}.`;
    case "evaluate-tradeoff":
      return `Evaluate the trade-off a team faces when applying ${lowerFirst(
        point.title
      )} to ${scenario.product}. Which factor should be prioritised first, and why?`;
    case "fix-misconception":
      return `A learner says ${lowerFirst(
        point.title
      )} is basically the same as a general improvement to the system. Correct the misconception and explain what should be said instead in ${scenario.organisation}.`;
    default:
      return point.practicePrompts[0] ?? point.summary;
  }
}

function buildTitle(point: CurriculumPoint, variant: CoverageQuestionVariant) {
  switch (variant) {
    case "core-explain":
      return `${point.code} core idea`;
    case "scenario-apply":
      return `${point.code} scenario application`;
    case "compare-justify":
      return `${point.code} justify a decision`;
    case "evaluate-impact":
      return `${point.code} evaluate the impact`;
    case "design-decision":
      return `${point.code} choose a design decision`;
    case "risk-priority":
      return `${point.code} prioritise a risk`;
    case "evaluate-tradeoff":
      return `${point.code} evaluate a trade-off`;
    case "fix-misconception":
      return `${point.code} fix a misconception`;
    default:
      return `${point.code} generated question`;
  }
}

function buildGeneratedQuestion(
  point: CurriculumPoint,
  variant: CoverageQuestionVariant
): QuestionMetadata {
  const legacyTopicIds = getTopicsForPoint(point);
  const primaryTopicId = getPrimaryTopicId(legacyTopicIds);
  const terms = getTermsForPoint(point.id);

  return {
    id: `generated-${slugify(point.id)}-${variant}`,
    sourceId: `generated-official-point-${slugify(point.id)}`,
    title: buildTitle(point, variant),
    sourceLabel: GENERATED_SOURCE_LABEL,
    questionType: getQuestionTypeForVariant(variant),
    marks: getMarksForVariant(variant),
    summary: buildSummary(point, variant),
    expectation: buildExpectation(point, terms, variant),
    curriculumPointIds: [point.id],
    legacyTopicIds,
    practicePrompt: buildPrompt(point, primaryTopicId, terms, variant),
    markSchemeConceptIds: [],
  };
}

const FACTORY_VARIANTS: CoverageQuestionVariant[] = [
  "core-explain",
  "scenario-apply",
  "compare-justify",
  "evaluate-impact",
];

const PRIORITY_CURATED_VARIANTS: CoverageQuestionVariant[] = [
  "design-decision",
  "risk-priority",
  "evaluate-tradeoff",
  "fix-misconception",
];

export const GENERATED_POINT_QUESTION_METADATA: QuestionMetadata[] = DSD_CURRICULUM_POINTS.flatMap(
  (point) => {
    const topicIds = getTopicsForPoint(point);
    const variants = [
      ...new Set(
        topicIds.some((topicId) => PRIORITY_CURATED_TOPICS.includes(topicId))
          ? [...FACTORY_VARIANTS, ...UNIVERSAL_CURATED_VARIANTS, ...PRIORITY_CURATED_VARIANTS]
          : [...FACTORY_VARIANTS, ...UNIVERSAL_CURATED_VARIANTS]
      ),
    ];

    return variants.map((variant) => buildGeneratedQuestion(point, variant));
  }
);
