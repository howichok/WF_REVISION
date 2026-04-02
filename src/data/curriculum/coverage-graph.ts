import { DSD_CURRICULUM_POINTS } from "./curriculum";
import { CONTENT_RESOURCES } from "./resources";
import { GENERATED_POINT_QUESTION_METADATA } from "./generated-point-questions";
import { GLOSSARY_TERMS } from "./glossary";
import { QUESTION_METADATA } from "./questions";
import { TOPIC_WEAK_PHRASE_DICTIONARIES } from "@/lib/intelligence/revision-improve-dictionaries";
import type {
  CoverageRewriteRule,
  CoverageQuestionVariant,
  CurriculumPointCoverageNode,
  TopicCoverageGraph,
} from "./types";

function asVariant(id: string): CoverageQuestionVariant | null {
  if (id.endsWith("core-explain")) return "core-explain";
  if (id.endsWith("scenario-apply")) return "scenario-apply";
  if (id.endsWith("compare-justify")) return "compare-justify";
  if (id.endsWith("evaluate-impact")) return "evaluate-impact";
  if (id.endsWith("design-decision")) return "design-decision";
  if (id.endsWith("risk-priority")) return "risk-priority";
  if (id.endsWith("evaluate-tradeoff")) return "evaluate-tradeoff";
  if (id.endsWith("fix-misconception")) return "fix-misconception";
  return null;
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function getCommandWordTargets(prompts: string[]) {
  return uniqueStrings(
    prompts.map((prompt) => prompt.match(/^(Explain|Describe|Discuss|Evaluate|Identify|State|Compare|Justify|Outline|Choose|Classify|Write|Design)\b/i)?.[1]?.toLowerCase())
  );
}

function buildTopicSpecificMisconceptionSignals(
  topicId: string,
  point: (typeof DSD_CURRICULUM_POINTS)[number]
) {
  const normalizedTitle = point.title.toLowerCase();

  if (topicId === "problem-solving") {
    if (
      normalizedTitle.includes("lifecycle") ||
      normalizedTitle.includes("requirement") ||
      normalizedTitle.includes("methodolog")
    ) {
      return [
        "Do not jump to a solution before defining user needs, constraints, and acceptance criteria.",
        "Avoid treating methodology choice as personal preference instead of matching it to risk, feedback speed, or documentation needs.",
        "Do not list lifecycle stages without explaining why that stage matters in the scenario.",
      ];
    }

    return [
      "Do not describe the problem in generic terms without naming the user need, risk, or delivery constraint.",
      "Avoid offering a solution before you show the actual requirement being met.",
      "Do not leave requirements vague when they could be made measurable or testable.",
    ];
  }

  if (topicId === "intro-programming") {
    if (normalizedTitle.includes("program structure") || normalizedTitle.includes("function")) {
      return [
        "Do not describe sequence, selection, iteration, and functions as interchangeable tools.",
        "Avoid saying a loop or function is used because it is better without linking it to the problem structure.",
        "Do not ignore maintainability and readability when choosing program structure.",
      ];
    }

    if (normalizedTitle.includes("validation")) {
      return [
        "Do not treat validation and error handling as the same thing.",
        "Avoid saying the code 'just fixes it' without naming the validation or error path.",
        "Do not confuse checking data before processing with handling a failure after it happens.",
      ];
    }

    if (normalizedTitle.includes("testing")) {
      return [
        "Do not confuse debugging with testing.",
        "Do not describe only one data type when the question is about a full test plan.",
        "Avoid naming a test type without explaining what it proves.",
      ];
    }
  }

  if (topicId === "emerging-issues") {
    return [
      "Do not assume a new technology is automatically the best choice without weighing risk, ethics, and implementation impact.",
      "Avoid describing AI, IoT, biometrics, or cloud services as benefits only; balance opportunity with limitation.",
      "Do not discuss future-proofing without naming the change, scale, or business pressure the solution must absorb.",
    ];
  }

  if (topicId === "legislation") {
    return [
      "Do not treat legal compliance and ethical behaviour as the same thing.",
      "Avoid naming a law, standard, or licence without linking it to a practical software decision.",
      "Do not reduce accessibility, privacy, or intellectual property to a box-ticking exercise without showing the real impact on users or release choices.",
    ];
  }

  if (topicId === "business") {
    if (normalizedTitle.includes("change") || normalizedTitle.includes("training")) {
      return [
        "Do not reduce change management to installation only.",
        "Avoid vague statements about users liking the system without an adoption outcome.",
        "Do not ignore training, rollout risk, or continuity when judging business change.",
      ];
    }

    return [
      "Do not describe business value in generic terms without naming continuity, trust, cost, or productivity.",
      "Avoid confusing user benefit with business benefit.",
      "Do not discuss a solution choice without linking it to a measurable business effect.",
    ];
  }

  if (topicId === "data") {
    return [
      "Do not treat raw data, structured records, and decision-ready information as interchangeable.",
      "Avoid talking about data quality, access, or storage without naming the control, model, or processing step involved.",
      "Do not describe data visualisation or analysis as useful without saying what pattern, metric, or decision it reveals.",
    ];
  }

  if (topicId === "digital-environments") {
    if (normalizedTitle.includes("network") || normalizedTitle.includes("protocol")) {
      return [
        "Do not treat devices, services, and protocols as the same thing in a network answer.",
        "Avoid naming a protocol without explaining the role it plays in the environment.",
        "Do not ignore resilience, bandwidth, latency, or manageability when judging a network choice.",
      ];
    }

    if (normalizedTitle.includes("cloud") || normalizedTitle.includes("virtual")) {
      return [
        "Do not treat cloud, virtual machines, and containers as interchangeable.",
        "Avoid saying a platform is better without naming scalability, resilience, or manageability.",
        "Do not forget the trade-off around cost, control, latency, or maintenance overhead.",
      ];
    }

    return [
      "Do not confuse redundancy with backup.",
      "Avoid mixing availability, performance, and security into one vague claim.",
      "Do not name infrastructure components without explaining their role in the environment.",
    ];
  }

  if (topicId === "security") {
    return [
      "Do not confuse authentication with authorisation or prevention with recovery.",
      "Avoid saying a system is secure without naming the threat reduced or the control applied.",
      "Do not merge confidentiality, integrity, and availability into one vague protection claim.",
    ];
  }

  if (topicId === "esp") {
    return [
      "Do not answer the employer-set project in generic terms without tying it back to the client brief and users.",
      "Avoid describing a feature as good without linking it to the project constraint, risk, or acceptance criteria.",
      "Do not discuss changes or deployment without showing how the project would be controlled in practice.",
    ];
  }

  return [];
}

function buildFallbackMisconceptionSignals(point: (typeof DSD_CURRICULUM_POINTS)[number]) {
  return [
    `Do not describe ${point.title.toLowerCase()} in generic terms without naming the exact mechanism or effect.`,
    "Avoid listing isolated facts without linking them to the system, user, or scenario.",
  ];
}

function buildPointRewriteRules(
  point: (typeof DSD_CURRICULUM_POINTS)[number],
  legacyTopicIds: string[]
) {
  const topicRules = legacyTopicIds.flatMap((topicId) =>
    (TOPIC_WEAK_PHRASE_DICTIONARIES[topicId] ?? []).map<CoverageRewriteRule>((rule) => ({
      target: rule.phrase,
      hint: rule.replacementHint,
      microRewrite: rule.microRewriteText,
    }))
  );
  const normalizedTitle = point.title.toLowerCase();
  const pointRules: CoverageRewriteRule[] = [];

  if (normalizedTitle.includes("validation")) {
    pointRules.push({
      target: "check it",
      hint: "Name the exact validation rule or condition being checked.",
      microRewrite: "validate it",
    });
    pointRules.push({
      target: "stop errors",
      hint: "Explain whether you prevent invalid input, catch an exception, or guide the user to correct it.",
      microRewrite: "prevent invalid input",
    });
  }

  if (
    normalizedTitle.includes("lifecycle") ||
    normalizedTitle.includes("requirement") ||
    normalizedTitle.includes("methodolog")
  ) {
    pointRules.push({
      target: "what users want",
      hint: "Turn this into a measurable requirement, acceptance criterion, or project constraint.",
      microRewrite: "user requirement",
    });
    pointRules.push({
      target: "best method",
      hint: "Justify the method by risk, change rate, documentation, or feedback speed.",
      microRewrite: "best-fit method",
    });
  }

  if (
    normalizedTitle.includes("legal") ||
    normalizedTitle.includes("ethical") ||
    normalizedTitle.includes("regulatory")
  ) {
    pointRules.push({
      target: "follow the law",
      hint: "Name the regulation, standard, or licence involved and explain the software decision it affects.",
      microRewrite: "meet the regulation",
    });
    pointRules.push({
      target: "protect data",
      hint: "State the control or duty that protects data, such as minimisation, consent, or access control.",
      microRewrite: "protect personal data",
    });
  }

  if (normalizedTitle.includes("risk")) {
    pointRules.push({
      target: "less risky",
      hint: "Name the exact technical or business risk being reduced and how the mitigation works.",
      microRewrite: "reduces key risk",
    });
    pointRules.push({
      target: "worth it",
      hint: "Balance the reward against severity, likelihood, continuity, or compliance impact.",
      microRewrite: "worth the trade-off",
    });
  }

  if (normalizedTitle.includes("source") || normalizedTitle.includes("feedback")) {
    pointRules.push({
      target: "good source",
      hint: "Explain why the source is trustworthy by checking authority, evidence, bias, or currency.",
      microRewrite: "credible source",
    });
    pointRules.push({
      target: "ask users",
      hint: "Choose the feedback method and explain why that method suits the audience or question.",
      microRewrite: "gather feedback",
    });
  }

  if (normalizedTitle.includes("testing")) {
    pointRules.push({
      target: "check if it works",
      hint: "Name the test type, test data, and what the result proves.",
      microRewrite: "run targeted test data",
    });
    pointRules.push({
      target: "find bugs",
      hint: "Separate testing from debugging by explaining the evidence the test produces.",
      microRewrite: "expose defects",
    });
  }

  if (normalizedTitle.includes("design") || normalizedTitle.includes("interface")) {
    pointRules.push({
      target: "looks good",
      hint: "Replace this with the UX, accessibility, readability, or consistency gain the design provides.",
      microRewrite: "improves usability",
    });
    pointRules.push({
      target: "easy to use",
      hint: "Name the interface decision that reduces friction, error, or accessibility barriers.",
      microRewrite: "supports usability",
    });
  }

  if (normalizedTitle.includes("database") || normalizedTitle.includes("data source")) {
    pointRules.push({
      target: "stores data",
      hint: "Explain the model, query, schema, or constraint that makes the data handling fit the problem.",
      microRewrite: "stores structured records",
    });
    pointRules.push({
      target: "get data",
      hint: "Name the request, endpoint, query, or credentials step used to retrieve it safely.",
      microRewrite: "retrieve data",
    });
  }

  if (normalizedTitle.includes("collaborative") || normalizedTitle.includes("team")) {
    pointRules.push({
      target: "work together",
      hint: "Explain whether the benefit is code review, knowledge transfer, traceability, or safer delivery.",
      microRewrite: "collaborate safely",
    });
    pointRules.push({
      target: "talk to the team",
      hint: "Name the tooling or process that keeps the collaboration reliable and traceable.",
      microRewrite: "coordinate through tooling",
    });
  }

  if (
    normalizedTitle.includes("implementation") ||
    normalizedTitle.includes("api") ||
    normalizedTitle.includes("deploy")
  ) {
    pointRules.push({
      target: "use an api",
      hint: "Explain what the API provides, how it is called, and why access must be controlled.",
      microRewrite: "call the API",
    });
    pointRules.push({
      target: "deploy it",
      hint: "Justify the deployment target by users, maintenance, scalability, or control.",
      microRewrite: "deploy appropriately",
    });
  }

  if (normalizedTitle.includes("test data")) {
    pointRules.push({
      target: "try values",
      hint: "Name valid, invalid, extreme, or erroneous data and the expected result.",
      microRewrite: "use test data",
    });
  }

  if (normalizedTitle.includes("change management") || normalizedTitle.includes("product change")) {
    pointRules.push({
      target: "update it",
      hint: "Explain the release control, regression testing, and communication needed to make the change safe.",
      microRewrite: "manage the update",
    });
    pointRules.push({
      target: "fix bugs",
      hint: "Separate corrective maintenance from adaptive or preventive change.",
      microRewrite: "apply corrective maintenance",
    });
  }

  if (normalizedTitle.includes("emerging technolog")) {
    pointRules.push({
      target: "new technology",
      hint: "Name the technology and explain one concrete opportunity or risk it creates.",
      microRewrite: "emerging technology",
    });
  }

  if (normalizedTitle.includes("program structure") || normalizedTitle.includes("function")) {
    pointRules.push({
      target: "make it easier",
      hint: "Explain whether the structure improves readability, reuse, testing, or maintenance.",
      microRewrite: "improve maintainability",
    });
    pointRules.push({
      target: "use a loop",
      hint: "Justify why iteration fits the repeated logic instead of naming a construct with no reason.",
      microRewrite: "use iteration",
    });
  }

  if (normalizedTitle.includes("business")) {
    pointRules.push({
      target: "helps the business",
      hint: "Name the specific business effect such as continuity, trust, or productivity.",
      microRewrite: "supports continuity",
    });
    pointRules.push({
      target: "users like it",
      hint: "Replace this with adoption, confidence, productivity, or reduced training friction.",
      microRewrite: "improves adoption",
    });
  }

  if (normalizedTitle.includes("change") || normalizedTitle.includes("training")) {
    pointRules.push({
      target: "roll it out",
      hint: "Name the rollout method and justify it by risk, disruption, or continuity.",
      microRewrite: "phase the rollout",
    });
    pointRules.push({
      target: "train staff",
      hint: "Explain what the training reduces, such as errors, resistance, or support load.",
      microRewrite: "prepare staff",
    });
  }

  if (normalizedTitle.includes("cloud") || normalizedTitle.includes("virtual")) {
    pointRules.push({
      target: "runs better",
      hint: "Name the environment gain such as scalability, resilience, or manageability.",
      microRewrite: "scales better",
    });
    pointRules.push({
      target: "stays online",
      hint: "Link this to redundancy, failover, or load balancing instead of only the outcome.",
      microRewrite: "maintains availability",
    });
  }

  if (normalizedTitle.includes("network") || normalizedTitle.includes("protocol")) {
    pointRules.push({
      target: "send data",
      hint: "Name the protocol or service and explain the role it plays in communication.",
      microRewrite: "transmit packets",
    });
    pointRules.push({
      target: "connect devices",
      hint: "Explain the network component, topology, or service that makes the connection reliable.",
      microRewrite: "provide connectivity",
    });
  }

  return [...new Map([...topicRules, ...pointRules].map((rule) => [rule.target, rule])).values()].slice(0, 6);
}

function buildImprovementSignals(point: (typeof DSD_CURRICULUM_POINTS)[number]) {
  return uniqueStrings([
    ...point.markSchemeIdeas.slice(0, 3),
    ...point.relatedConcepts.slice(0, 2).map((concept) => `Link ${concept} clearly.`),
    ...point.relatedTerms.slice(0, 2).map((term) => `Use ${term} accurately.`),
    "Show the consequence, trade-off, or impact instead of staying generic.",
  ]).slice(0, 6);
}

function buildResourcePriorityIds(pointId: string) {
  return CONTENT_RESOURCES.filter((resource) => resource.curriculumPointIds.includes(pointId))
    .sort((left, right) => {
      const leftPriority =
        left.kind === "specification"
          ? 5
          : left.kind === "mark-scheme"
            ? 4
            : left.kind === "past-paper"
              ? 3
              : left.kind === "question-bank"
                ? 2
                : 1;
      const rightPriority =
        right.kind === "specification"
          ? 5
          : right.kind === "mark-scheme"
            ? 4
            : right.kind === "past-paper"
              ? 3
              : right.kind === "question-bank"
                ? 2
                : 1;

      if (rightPriority !== leftPriority) {
        return rightPriority - leftPriority;
      }

      return (right.year ?? 0) - (left.year ?? 0);
    })
    .map((resource) => resource.id)
    .slice(0, 5);
}

function buildFallbackResourcePriorityIds(
  pointId: string,
  legacyTopicIds: string[]
) {
  const direct = buildResourcePriorityIds(pointId);
  if (direct.length > 0) {
    return direct;
  }

  return CONTENT_RESOURCES.filter((resource) =>
    resource.legacyTopicIds.some((topicId) => legacyTopicIds.includes(topicId))
  )
    .map((resource) => resource.id)
    .slice(0, 5);
}

function buildFollowUpQuestionIds(
  questionsForPoint: typeof QUESTION_METADATA,
  generatedForPoint: typeof GENERATED_POINT_QUESTION_METADATA
) {
  const generatedPriority = generatedForPoint
    .sort((left, right) => {
      const leftVariant = asVariant(left.id);
      const rightVariant = asVariant(right.id);
      const order: Record<CoverageQuestionVariant, number> = {
        "fix-misconception": 6,
        "evaluate-tradeoff": 5,
        "risk-priority": 5,
        "design-decision": 4,
        "scenario-apply": 4,
        "compare-justify": 3,
        "evaluate-impact": 2,
        "core-explain": 1,
      };

      return (order[rightVariant ?? "core-explain"] ?? 0) - (order[leftVariant ?? "core-explain"] ?? 0);
    })
    .map((question) => question.id);

  const mappedPriority = questionsForPoint
    .sort((left, right) => {
      const leftPriority =
        left.questionType === "scenario"
          ? 4
          : left.questionType === "extended-response"
            ? 3
            : left.questionType === "medium-open"
              ? 2
              : 1;
      const rightPriority =
        right.questionType === "scenario"
          ? 4
          : right.questionType === "extended-response"
            ? 3
            : right.questionType === "medium-open"
              ? 2
              : 1;

      if (rightPriority !== leftPriority) {
        return rightPriority - leftPriority;
      }

      return (right.marks ?? 0) - (left.marks ?? 0);
    })
    .map((question) => question.id);

  return uniqueStrings([...generatedPriority, ...mappedPriority]).slice(0, 6);
}

export const CURRICULUM_POINT_COVERAGE_NODES: CurriculumPointCoverageNode[] =
  DSD_CURRICULUM_POINTS.map((point) => {
    const questionsForPoint = QUESTION_METADATA.filter((question) =>
      question.curriculumPointIds.includes(point.id)
    );
    const generatedForPoint = GENERATED_POINT_QUESTION_METADATA.filter((question) =>
      question.curriculumPointIds.includes(point.id)
    );
    const legacyTopicIds = [
      ...new Set([
        ...questionsForPoint.flatMap((question) => question.legacyTopicIds),
        ...generatedForPoint.flatMap((question) => question.legacyTopicIds),
      ]),
    ];
    const misconceptionSignals = uniqueStrings(
      legacyTopicIds.flatMap((topicId) =>
        buildTopicSpecificMisconceptionSignals(topicId, point)
      )
    );
    const rewriteRules = buildPointRewriteRules(point, legacyTopicIds);
    const commandWordTargets = getCommandWordTargets(point.practicePrompts);

    return {
      pointId: point.id,
      pointCode: point.code,
      pointTitle: point.title,
      legacyTopicIds,
      relatedTerms: GLOSSARY_TERMS.filter((term) =>
        term.curriculumPointIds.includes(point.id)
      ).map((term) => term.term),
      relatedConcepts: point.relatedConcepts,
      questionIds: questionsForPoint.map((question) => question.id),
      generatedQuestionIds: generatedForPoint.map((question) => question.id),
      generatedVariants: generatedForPoint
        .map((question) => asVariant(question.id))
        .filter((variant): variant is CoverageQuestionVariant => Boolean(variant)),
      misconceptionSignals:
        misconceptionSignals.length > 0
          ? misconceptionSignals
          : buildFallbackMisconceptionSignals(point),
      rewriteRules:
        rewriteRules.length > 0
          ? rewriteRules
          : [
              {
                target: "important",
                hint: `Name the exact ${point.title.toLowerCase()} benefit, risk, or effect instead of vague emphasis.`,
                microRewrite: "significant",
              },
            ],
      resourcePriorityIds: buildFallbackResourcePriorityIds(point.id, legacyTopicIds),
      followUpQuestionIds: buildFollowUpQuestionIds(questionsForPoint, generatedForPoint),
      commandWordTargets:
        commandWordTargets.length > 0
          ? commandWordTargets
          : ["explain", "apply", "evaluate"],
      improvementSignals: buildImprovementSignals(point),
    };
  });

export const TOPIC_COVERAGE_GRAPHS: TopicCoverageGraph[] = [
  ...new Set(QUESTION_METADATA.flatMap((question) => question.legacyTopicIds)),
].map((topicId) => {
  const coverageByPoint = CURRICULUM_POINT_COVERAGE_NODES.filter((point) =>
    point.legacyTopicIds.includes(topicId)
  );
  const questionsForTopic = QUESTION_METADATA.filter((question) =>
    question.legacyTopicIds.includes(topicId)
  );
  const generatedQuestionsForTopic = GENERATED_POINT_QUESTION_METADATA.filter((question) =>
    question.legacyTopicIds.includes(topicId)
  );

  return {
    topicId,
    coveredPointIds: coverageByPoint.map((point) => point.pointId),
    generatedQuestionIds: generatedQuestionsForTopic.map((question) => question.id),
    generatedQuestionCount: generatedQuestionsForTopic.length,
    totalQuestionCount: questionsForTopic.length,
    relatedTerms: [
      ...new Set(coverageByPoint.flatMap((point) => point.relatedTerms)),
    ],
    coverageByPoint,
  };
});
