import { extractCommandWord } from "@/lib/command-words";
import { getTopicCoachingEntry, type TopicCoachingMemoryMap } from "@/lib/coaching-memory";
import { getTopicCoverageGraph, getTopicContentBundle, getResourceHref } from "@/lib/content";
import { getPracticeQuestionsForTopic } from "@/lib/intelligence/catalog";
import type { TopicIntelligenceResponse } from "@/lib/intelligence/types";
import {
  getPracticeSetId,
  getTopicPracticeBundle,
  type PracticeExamDrill,
} from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import type { TopicLearningMode } from "@/lib/revision-routes";
import type { RevisionProgressEntry } from "@/lib/types";

type RecommendationActionKind = "route" | "external";
type RecommendationDifficulty = "support" | "same" | "harder";

export interface TopicNextStepRecommendation {
  kind:
    | "ask"
    | "recall"
    | "quiz"
    | "exam-drill"
    | "answer-check"
    | "official-source"
    | "resource"
    | "replay"
    | "exam-questions";
  label: string;
  href: string;
  why: string;
  targetId?: string;
  difficulty: RecommendationDifficulty;
  actionKind: RecommendationActionKind;
  reasonCode: string;
}

export interface TopicNextStepSet {
  primary: TopicNextStepRecommendation | null;
  secondary: TopicNextStepRecommendation | null;
}

export interface TopicPracticeStudioRecommendation {
  suggestedMode: TopicLearningMode;
  why: string;
}

interface AnswerCheckNextStepOptions {
  topicId: string;
  questionId?: string;
  scorePercent: number;
  revisionProgress: RevisionProgressEntry[];
  coachingMemory?: TopicCoachingMemoryMap;
}

interface ExamDrillNextStepOptions {
  topicId: string;
  drillId?: string;
  lastRating?: "needs-work" | "ready";
  readinessPercent: number;
  revisionProgress: RevisionProgressEntry[];
  coachingMemory?: TopicCoachingMemoryMap;
}

interface AskNextStepOptions {
  topicId: string;
  result: TopicIntelligenceResponse;
  revisionProgress: RevisionProgressEntry[];
  coachingMemory?: TopicCoachingMemoryMap;
}

interface RecallNextStepOptions {
  topicId: string;
  masteryPercent: number;
  revisionProgress: RevisionProgressEntry[];
  coachingMemory?: TopicCoachingMemoryMap;
}

interface QuizNextStepOptions {
  topicId: string;
  scorePercent: number;
  revisionProgress: RevisionProgressEntry[];
  coachingMemory?: TopicCoachingMemoryMap;
}

function buildRouteRecommendation(
  kind: TopicNextStepRecommendation["kind"],
  label: string,
  href: string,
  why: string,
  difficulty: RecommendationDifficulty,
  targetId?: string,
  reasonCode = `${kind}:${difficulty}`
): TopicNextStepRecommendation {
  return {
    kind,
    label,
    href,
    why,
    targetId,
    difficulty,
    actionKind: "route",
    reasonCode,
  };
}

function buildExternalRecommendation(
  label: string,
  href: string,
  why: string,
  reasonCode = "official-source:support"
): TopicNextStepRecommendation {
  return {
    kind: "official-source",
    label,
    href,
    why,
    difficulty: "support",
    actionKind: "external",
    reasonCode,
  };
}

function dedupeRecommendations(
  primary: TopicNextStepRecommendation | null,
  secondary: TopicNextStepRecommendation | null
): TopicNextStepSet {
  if (!primary) {
    return { primary: null, secondary };
  }

  if (!secondary || secondary.href !== primary.href) {
    return { primary, secondary };
  }

  return { primary, secondary: null };
}

function buildAskHref(topicId: string, intent: string, query: string) {
  const params = new URLSearchParams({
    intent,
    query,
    autoRun: "1",
  });

  return `/revision/${topicId}/ask?${params.toString()}`;
}

function buildExamDrillHref(topicId: string, drillId?: string) {
  const params = new URLSearchParams();
  if (drillId) {
    params.set("drillId", drillId);
  }

  return params.size
    ? `/revision/${topicId}/exam-conditions?${params.toString()}`
    : `/revision/${topicId}/exam-conditions`;
}

function buildAnswerCheckHref(topicId: string, questionId?: string) {
  if (!questionId) {
    return `/revision/${topicId}/exam-conditions`;
  }

  return `/revision/${topicId}/exam-conditions?questionId=${encodeURIComponent(questionId)}`;
}

function getCommandWordId(value?: string | null) {
  return value ? extractCommandWord(value)?.id ?? null : null;
}

function getDrillPointId(drill: PracticeExamDrill) {
  const pointMatch =
    drill.questionId.match(/^point-([a-z0-9-]+)-\d+$/i) ??
    drill.id.match(/^exam-drill-point-([a-z0-9-]+)-\d+$/i);

  return pointMatch?.[1] ?? null;
}

function getReviewedSubtopicIds(revisionProgress: RevisionProgressEntry[], topicId: string) {
  return revisionProgress
    .filter(
      (entry) =>
        entry.topicId === topicId &&
        entry.entityType === "subtopic" &&
        entry.status === "completed"
    )
    .map((entry) => entry.entityId);
}

function getNextUncoveredPointId(
  topicId: string,
  revisionProgress: RevisionProgressEntry[],
  excludedPointIds: string[] = []
) {
  const graph = getTopicCoverageGraph(topicId);
  if (!graph) {
    return null;
  }

  const reviewedSubtopics = getReviewedSubtopicIds(revisionProgress, topicId);
  const uncoveredByProgress =
    graph.coverageByPoint.find(
      (node) =>
        !excludedPointIds.includes(node.pointId) &&
        reviewedSubtopics.every((subtopicId) => !node.pointCode.startsWith(subtopicId))
    ) ?? null;

  if (uncoveredByProgress) {
    return uncoveredByProgress.pointId;
  }

  return (
    graph.coverageByPoint.find((node) => !excludedPointIds.includes(node.pointId))?.pointId ??
    null
  );
}

function findDrillById(topicId: string, drillId?: string | null) {
  if (!drillId) {
    return null;
  }

  return getTopicPracticeBundle(topicId).examDrills.find((drill) => drill.id === drillId) ?? null;
}

function getQuestionPointId(topicId: string, questionId?: string | null) {
  if (!questionId) {
    return null;
  }

  const graph = getTopicCoverageGraph(topicId);
  if (!graph) {
    return questionId;
  }

  return (
    graph.coverageByPoint.find(
      (node) =>
        node.questionIds.includes(questionId) ||
        node.generatedQuestionIds.includes(questionId) ||
        node.followUpQuestionIds.includes(questionId)
    )?.pointId ?? questionId
  );
}

function getDrillTargetPointId(topicId: string, drillId?: string | null) {
  const drill = findDrillById(topicId, drillId);
  if (!drill) {
    return drillId ?? null;
  }

  return getDrillPointId(drill) ?? getQuestionPointId(topicId, drill.questionId) ?? drill.id;
}

function getPriorityTopicMemory(
  coachingMemory: TopicCoachingMemoryMap | undefined,
  topicId: string
) {
  return getTopicCoachingEntry(coachingMemory, topicId);
}

function pickBestDrill(
  topicId: string,
  options: {
    commandWordId?: string | null;
    preferredPointId?: string | null;
    excludeDrillId?: string | null;
  } = {}
) {
  const drills = getTopicPracticeBundle(topicId).examDrills;

  return (
    drills
      .map((drill) => {
        let score = 0;
        const drillCommandWordId = getCommandWordId(drill.prompt);
        const drillPointId = getDrillPointId(drill);

        if (options.preferredPointId && drillPointId === options.preferredPointId) {
          score += 24;
        }

        if (options.commandWordId && drillCommandWordId === options.commandWordId) {
          score += 12;
        }

        if (drill.sourceType === "official-point") {
          score += 6;
        }

        if (options.excludeDrillId && drill.id === options.excludeDrillId) {
          score -= 16;
        }

        return { drill, score };
      })
      .sort((left, right) => right.score - left.score)[0]?.drill ?? null
  );
}

function pickBestAnswerCheckQuestion(
  topicId: string,
  options: {
    commandWordId?: string | null;
    excludeQuestionId?: string | null;
  } = {}
) {
  const questions = getPracticeQuestionsForTopic(topicId);

  return (
    questions
      .map((question) => {
        let score = 0;
        const questionCommandWordId = getCommandWordId(question.prompt);

        if (options.commandWordId && questionCommandWordId === options.commandWordId) {
          score += 14;
        }

        if (options.excludeQuestionId && question.id === options.excludeQuestionId) {
          score -= 18;
        }

        if (question.maxScore >= 6) {
          score += 4;
        }

        return { question, score };
      })
      .sort((left, right) => right.score - left.score)[0]?.question ?? null
  );
}

function getOfficialSourceRecommendation(topicId: string) {
  const bundle = getTopicContentBundle(topicId);
  const official = bundle.resources.find((resource) => {
    const href = getResourceHref(resource);
    return Boolean(href?.startsWith("http"));
  });
  const href = official ? getResourceHref(official) : undefined;

  if (!official || !href) {
    return null;
  }

  return buildExternalRecommendation(
    "Open official source",
    href,
    "Use the mapped Pearson or T Levels source to confirm the official wording for this topic."
  );
}

export function getTopicPracticeStudioRecommendation(
  topicId: string,
  revisionProgress: RevisionProgressEntry[],
  coachingMemory?: TopicCoachingMemoryMap
): TopicPracticeStudioRecommendation {
  const memory = getPriorityTopicMemory(coachingMemory, topicId);
  const recallProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "recall"))
      ?.progressPercent ?? 0;
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "exam-drill"))
      ?.progressPercent ?? 0;
  const quizProgress =
    getPracticeSetProgress(revisionProgress, topicId, getPracticeSetId(topicId, "quiz"))
      ?.progressPercent ?? 0;

  if (memory?.failStreak && memory.failStreak >= 2) {
    return {
      suggestedMode: "ask",
      why: "You hit the same weak area more than once, so the next best move is a scaffold-only same-topic coaching pass before another marked answer.",
    };
  }

  if (memory?.drillReadyStreak && memory.drillReadyStreak >= 2) {
    return {
      suggestedMode: "answer-check",
      why: "You have been ready twice in guided planning, so the best next step is a full rubric-based answer in the same topic.",
    };
  }

  if (recallProgress === 0 && examProgress === 0 && quizProgress === 0) {
    return {
      suggestedMode: "ask",
      why: "Start with Universal Ask DSD to identify the best same-topic entrypoint before you commit to a practice mode.",
    };
  }

  if (recallProgress < 40) {
    return {
      suggestedMode: "recall",
      why: "Recall is still the weakest same-topic signal, so tighten the key terms and points before moving up to harder wording.",
    };
  }

  if (examProgress < 40) {
    return {
      suggestedMode: "exam-drill",
      why: "Your next same-topic gain is guided planning before you jump into full answer checking.",
    };
  }

  if (quizProgress < 60) {
    return {
      suggestedMode: "quiz",
      why: "The quick quiz is the fastest way to tighten retrieval gaps before another written-answer pass.",
    };
  }

  return {
    suggestedMode: "answer-check",
    why: "Your retrieval is warm enough that the best next step is a rubric-based written answer in the same topic.",
  };
}

export function getAnswerCheckNextStepRecommendations(
  options: AnswerCheckNextStepOptions
): TopicNextStepSet {
  const currentQuestion = options.questionId
    ? getPracticeQuestionsForTopic(options.topicId).find((question) => question.id === options.questionId)
    : null;
  const commandWordId = getCommandWordId(currentQuestion?.prompt);
  const currentPointId = getQuestionPointId(options.topicId, options.questionId);
  const memory = getPriorityTopicMemory(options.coachingMemory, options.topicId);

  if (options.scorePercent < 40) {
    if (
      memory?.failStreak &&
      memory.failStreak >= 2 &&
      currentPointId &&
      memory.lastWeakPointId === currentPointId
    ) {
      const primary = buildRouteRecommendation(
        "ask",
        "Force a scaffold before retrying",
        buildAskHref(
          options.topicId,
          "hint",
          currentQuestion?.prompt ?? "How should I structure this answer?"
        ),
        "You have already missed this same concept twice, so the next best move is a guided scaffold before another marked response.",
        "support",
        currentPointId,
        "answer-check:repeat-fail-hint"
      );
      const secondary = buildRouteRecommendation(
        "replay",
        "Replay the weak drill",
        buildExamDrillHref(
          options.topicId,
          pickBestDrill(options.topicId, {
            commandWordId,
            preferredPointId: currentPointId,
          })?.id
        ),
        "Stay on the same point, but drop back to guided planning instead of another full answer immediately.",
        "support",
        currentPointId,
        "answer-check:repeat-fail-replay"
      );

      return dedupeRecommendations(primary, secondary);
    }

    const replayDrill = pickBestDrill(options.topicId, {
      commandWordId,
      preferredPointId: currentPointId,
    });
    const primary = buildRouteRecommendation(
      "replay",
      "Replay the weak area",
      buildExamDrillHref(options.topicId, replayDrill?.id),
      "Stay in the same topic and rebuild the answer structure with a guided drill before another rubric check.",
      "support",
      replayDrill?.id ?? undefined,
      "answer-check:weak-replay"
    );
    const secondary = buildRouteRecommendation(
      "ask",
      "Open a guided hint",
      buildAskHref(
        options.topicId,
        "hint",
        currentQuestion?.prompt ?? "How should I answer this question?"
      ),
      "Use a scaffold-only hint route for the same topic instead of jumping elsewhere.",
      "support",
      currentPointId ?? undefined,
      "answer-check:weak-hint"
    );

    return dedupeRecommendations(primary, secondary);
  }

  if (options.scorePercent < 70) {
    const harderQuestion = pickBestAnswerCheckQuestion(options.topicId, {
      commandWordId,
      excludeQuestionId: options.questionId,
    });
    const backupDrill = pickBestDrill(options.topicId, {
      commandWordId,
    });
    const primary = buildRouteRecommendation(
      "answer-check",
      "Try a harder same-topic answer",
      buildAnswerCheckHref(options.topicId, harderQuestion?.id),
      "You are around merit, so the best next move is another closely matched question in the same topic.",
      "harder",
      harderQuestion?.id ?? undefined,
      "answer-check:merit-harder"
    );
    const secondary = buildRouteRecommendation(
      "exam-drill",
      "Reinforce the same command word",
      buildExamDrillHref(options.topicId, backupDrill?.id),
      "Repeat the command word in a lighter drill before you return to full marking.",
      "same",
      backupDrill?.id ?? undefined,
      "answer-check:merit-drill"
    );

    return dedupeRecommendations(primary, secondary);
  }

  const nextPointId = getNextUncoveredPointId(
    options.topicId,
    options.revisionProgress,
    currentPointId ? [currentPointId] : []
  );
  const nextPointDrill = pickBestDrill(options.topicId, {
    preferredPointId: nextPointId,
  });
  const harderQuestion = pickBestAnswerCheckQuestion(options.topicId, {
    commandWordId,
    excludeQuestionId: options.questionId,
  });
  const primary = buildRouteRecommendation(
    "exam-drill",
    "Move to the next uncovered point",
    buildExamDrillHref(options.topicId, nextPointDrill?.id),
    "You are already strong on this response, so stay in the topic and expand coverage to the next point.",
    "harder",
    nextPointDrill?.id ?? nextPointId ?? undefined,
    memory?.distinctionStreak && memory.distinctionStreak >= 1
      ? "answer-check:distinction-next-point"
      : "answer-check:stronger-next-point"
  );
  const secondary = buildRouteRecommendation(
    "answer-check",
    "Lock it in with another written answer",
    buildAnswerCheckHref(options.topicId, harderQuestion?.id),
    "Use one more same-topic written answer if you want to keep the pressure up.",
    "harder",
    harderQuestion?.id ?? undefined,
    "answer-check:distinction-harder"
  );

  return dedupeRecommendations(primary, secondary);
}

export function getExamDrillNextStepRecommendations(
  options: ExamDrillNextStepOptions
): TopicNextStepSet {
  const currentDrill = findDrillById(options.topicId, options.drillId);
  const commandWordId = getCommandWordId(currentDrill?.prompt);
  const currentPointId = currentDrill
    ? getDrillPointId(currentDrill) ??
      getQuestionPointId(options.topicId, currentDrill.questionId) ??
      currentDrill.id
    : null;
  const memory = getPriorityTopicMemory(options.coachingMemory, options.topicId);

  if (options.lastRating === "needs-work" || options.readinessPercent < 70) {
    if (
      memory?.drillNeedsWorkStreak &&
      memory.drillNeedsWorkStreak >= 2 &&
      currentPointId &&
      memory.lastWeakPointId === currentPointId
    ) {
      const primary = buildRouteRecommendation(
        "ask",
        "Open a scaffold before the next drill",
        buildAskHref(
          options.topicId,
          "hint",
          currentDrill?.prompt ?? "How should I structure this answer?"
        ),
        "You have repeated the same weak drill area, so take a scaffold-only pass before another self-rated attempt.",
        "support",
        currentPointId,
        "exam-drill:repeat-weak-hint"
      );
      const secondary = buildRouteRecommendation(
        "replay",
        "Replay this weak drill",
        buildExamDrillHref(options.topicId, options.drillId),
        "Stay on the same point after the scaffold so the structure becomes more stable.",
        "support",
        options.drillId ?? currentPointId,
        "exam-drill:repeat-weak-replay"
      );

      return dedupeRecommendations(primary, secondary);
    }

    const replayDrill = pickBestDrill(options.topicId, {
      commandWordId,
      preferredPointId: currentPointId,
    });
    const primary = buildRouteRecommendation(
      "replay",
      "Replay this weak drill",
      buildExamDrillHref(options.topicId, replayDrill?.id ?? options.drillId),
      "Stay with the same command word or point until the structure feels stable.",
      "support",
      replayDrill?.id ?? options.drillId ?? undefined,
      "exam-drill:weak-replay"
    );
    const secondary = buildRouteRecommendation(
      "ask",
      "Open a topic hint",
      buildAskHref(
        options.topicId,
        "hint",
        currentDrill?.prompt ?? "How should I structure this answer?"
      ),
      "Use a scaffold-only hint if the plan still feels unclear before another drill pass.",
      "support",
      currentPointId ?? undefined,
      "exam-drill:weak-hint"
    );

    return dedupeRecommendations(primary, secondary);
  }

  const answerCheckQuestion = pickBestAnswerCheckQuestion(options.topicId, {
    commandWordId,
  });
  const harderDrill = pickBestDrill(options.topicId, {
    commandWordId,
    preferredPointId: getNextUncoveredPointId(options.topicId, options.revisionProgress, currentPointId ? [currentPointId] : []),
    excludeDrillId: options.drillId,
  });
  const primary = buildRouteRecommendation(
    "answer-check",
    "Move to answer check",
    buildAnswerCheckHref(options.topicId, answerCheckQuestion?.id),
    "Your drill readiness is strong enough to move into a rubric-based written answer in the same topic.",
    "harder",
    answerCheckQuestion?.id ?? undefined,
    memory?.drillReadyStreak && memory.drillReadyStreak >= 2
      ? "exam-drill:repeat-ready-answer-check"
      : "exam-drill:ready-answer-check"
  );
  const secondary = buildRouteRecommendation(
    "exam-drill",
    "Try a harder drill",
    buildExamDrillHref(options.topicId, harderDrill?.id),
    "If you want one more rehearsal first, step up to a slightly harder same-topic drill.",
    "harder",
    harderDrill?.id ?? undefined,
    "exam-drill:ready-harder"
  );

  return dedupeRecommendations(primary, secondary);
}

export function getAskNextStepRecommendations(
  options: AskNextStepOptions
): TopicNextStepSet {
  const memory = getPriorityTopicMemory(options.coachingMemory, options.topicId);
  const officialSource = getOfficialSourceRecommendation(options.topicId);
  const relatedAnswerCheck =
    options.result.relatedQuestions.find((question) => question.kind === "answer-check") ?? null;
  const relatedDrill =
    options.result.relatedQuestions.find((question) => question.kind === "exam-drill") ?? null;
  const drillFromBundle = pickBestDrill(options.topicId);
  const answerCheckFallback = pickBestAnswerCheckQuestion(options.topicId);

  if (
    options.result.intent === "hint" ||
    options.result.intent === "local-answer" ||
    options.result.intent === "misconception-fix"
  ) {
    const primary = buildRouteRecommendation(
      "exam-drill",
      "Practice this same topic next",
      relatedDrill?.href ?? buildExamDrillHref(options.topicId, drillFromBundle?.id),
      "Move straight into a same-topic drill so the explanation turns into a usable answer structure.",
      "same",
      relatedDrill?.id ?? drillFromBundle?.id ?? undefined,
      memory?.failStreak && memory.failStreak >= 2
        ? "ask:recover-with-drill"
        : "ask:practice-next"
    );
    const secondary = buildRouteRecommendation(
      "answer-check",
      "Try a written answer",
      relatedAnswerCheck?.href ?? buildAnswerCheckHref(options.topicId, answerCheckFallback?.id),
      "If you already feel ready, jump straight into rubric-based checking on the same topic.",
      "harder",
      relatedAnswerCheck?.id ?? answerCheckFallback?.id ?? undefined,
      "ask:answer-check-next"
    );

    return dedupeRecommendations(primary, secondary);
  }

  if (
    options.result.intent === "resource-pick" ||
    options.result.intent === "grounded-answer"
  ) {
    const primary =
      options.result.sources.find((source) => source.href?.startsWith("http"))?.href && officialSource
        ? officialSource
        : buildRouteRecommendation(
            "exam-drill",
        "Turn the source into practice",
        relatedDrill?.href ?? buildExamDrillHref(options.topicId, drillFromBundle?.id),
        "After checking the official wording, stay in the same topic and test it with a guided prompt.",
        "same",
        relatedDrill?.id ?? drillFromBundle?.id ?? undefined,
        "ask:source-to-practice"
      );
    const secondary = buildRouteRecommendation(
      "answer-check",
      "Apply it in answer check",
      relatedAnswerCheck?.href ?? buildAnswerCheckHref(options.topicId, answerCheckFallback?.id),
      "Use the confirmed wording inside a marked written response while the source is still fresh.",
      "harder",
      relatedAnswerCheck?.id ?? answerCheckFallback?.id ?? undefined,
      "ask:source-to-answer-check"
    );

    return dedupeRecommendations(primary, secondary);
  }

  if (options.result.intent === "practice-question") {
    const primary = buildRouteRecommendation(
      "exam-drill",
      "Open the targeted drill",
      relatedDrill?.href ?? buildExamDrillHref(options.topicId, drillFromBundle?.id),
      "The next best move is to answer the prompt the router already picked for this same topic.",
      "same",
      relatedDrill?.id ?? drillFromBundle?.id ?? undefined,
      "ask:open-drill"
    );
    const secondary = buildRouteRecommendation(
      "answer-check",
      "Push it into mark-scheme mode",
      relatedAnswerCheck?.href ?? buildAnswerCheckHref(options.topicId, answerCheckFallback?.id),
      "Once you plan it once, use answer-check to see how close your wording is to the rubric.",
      "harder",
      relatedAnswerCheck?.id ?? answerCheckFallback?.id ?? undefined,
      "ask:drill-to-answer-check"
    );

    return dedupeRecommendations(primary, secondary);
  }

  return dedupeRecommendations(
    buildRouteRecommendation(
      "exam-drill",
      "Stay in the same topic",
      relatedDrill?.href ?? buildExamDrillHref(options.topicId, drillFromBundle?.id),
      "The next step stays inside the same topic so the explanation turns into usable exam practice.",
      "same",
      relatedDrill?.id ?? drillFromBundle?.id ?? undefined,
      "ask:same-topic-next"
    ),
    officialSource
  );
}

export function getRecallNextStepRecommendations(
  options: RecallNextStepOptions
): TopicNextStepSet {
  const memory = getPriorityTopicMemory(options.coachingMemory, options.topicId);
  const drill = pickBestDrill(options.topicId, {
    preferredPointId: memory?.lastWeakPointId ?? null,
  });
  const answerCheck = pickBestAnswerCheckQuestion(options.topicId);

  if (options.masteryPercent < 40) {
    return dedupeRecommendations(
      buildRouteRecommendation(
        "replay",
        "Replay recall before moving on",
        `/revision/${options.topicId}/recall`,
        "Keep the retrieval loop inside the same topic until the key terms and points stop collapsing.",
        "support",
        memory?.lastWeakPointId ?? undefined,
        "recall:repeat"
      ),
      buildRouteRecommendation(
        "ask",
        "Open a topic hint",
        buildAskHref(options.topicId, "hint", "What are the key ideas I keep missing in this topic?"),
        "If recall is still weak, use a scaffold-only coach before stepping up to longer tasks.",
        "support",
        memory?.lastWeakPointId ?? undefined,
        "recall:hint"
      )
    );
  }

  if (options.masteryPercent < 70) {
    return dedupeRecommendations(
      buildRouteRecommendation(
        "exam-drill",
        "Move into a guided drill",
        buildExamDrillHref(options.topicId, drill?.id),
        "Your recall is warm enough that the best next gain is planning a same-topic exam response.",
        "same",
        drill?.id ?? undefined,
        "recall:drill"
      ),
      buildRouteRecommendation(
        "ask",
        "Clarify a weak concept first",
        buildAskHref(options.topicId, "local-answer", "Explain the part of this topic I still keep missing."),
        "Use a short explanation if one concept is still blocking your confidence.",
        "support",
        memory?.lastWeakPointId ?? undefined,
        "recall:clarify"
      )
    );
  }

  return dedupeRecommendations(
    buildRouteRecommendation(
      "answer-check",
      "Turn recall into a written answer",
      buildAnswerCheckHref(options.topicId, answerCheck?.id),
      "Strong recall should now be converted into rubric-based exam wording in the same topic.",
      "harder",
      answerCheck?.id ?? undefined,
      "recall:answer-check"
    ),
    buildRouteRecommendation(
      "exam-drill",
      "Rehearse once before marking",
      buildExamDrillHref(options.topicId, drill?.id),
      "If you want a lighter step first, use one guided drill before the full answer checker.",
      "same",
      drill?.id ?? undefined,
      "recall:drill-before-marking"
    )
  );
}

export function getQuizNextStepRecommendations(
  options: QuizNextStepOptions
): TopicNextStepSet {
  const memory = getPriorityTopicMemory(options.coachingMemory, options.topicId);
  const drill = pickBestDrill(options.topicId, {
    preferredPointId: memory?.lastWeakPointId ?? null,
  });
  const answerCheck = pickBestAnswerCheckQuestion(options.topicId);

  if (options.scorePercent < 40) {
    return dedupeRecommendations(
      buildRouteRecommendation(
        "replay",
        "Replay the same topic quiz",
        `/revision/${options.topicId}/quiz`,
        "The retrieval signal is still weak, so keep the quiz loop inside the same topic once more.",
        "support",
        memory?.lastWeakPointId ?? undefined,
        "quiz:repeat"
      ),
      buildRouteRecommendation(
        "recall",
        "Drop back to recall",
        `/revision/${options.topicId}/recall`,
        "If the quiz felt too jumpy, tighten the key terms and points in recall first.",
        "support",
        memory?.lastWeakPointId ?? undefined,
        "quiz:drop-to-recall"
      )
    );
  }

  if (options.scorePercent < 70) {
    return dedupeRecommendations(
      buildRouteRecommendation(
        "exam-drill",
        "Move into exam drill",
        buildExamDrillHref(options.topicId, drill?.id),
        "The next same-topic gain is guided exam planning rather than more pure retrieval.",
        "same",
        drill?.id ?? undefined,
        "quiz:drill"
      ),
      buildRouteRecommendation(
        "answer-check",
        "Try a written answer if you feel ready",
        buildAnswerCheckHref(options.topicId, answerCheck?.id),
        "If the quiz felt stable enough, step up to a marked written response.",
        "harder",
        answerCheck?.id ?? undefined,
        "quiz:answer-check"
      )
    );
  }

  return dedupeRecommendations(
    buildRouteRecommendation(
      "answer-check",
      "Push straight into answer check",
      buildAnswerCheckHref(options.topicId, answerCheck?.id),
      "Strong quiz performance means the fastest next gain is rubric-based written practice in the same topic.",
      "harder",
      answerCheck?.id ?? undefined,
      "quiz:strong-answer-check"
    ),
    buildRouteRecommendation(
      "exam-drill",
      "Use one guided drill first",
      buildExamDrillHref(options.topicId, drill?.id),
      "If you want a gentler step, rehearse the structure once before the full checker.",
      "same",
      drill?.id ?? undefined,
      "quiz:strong-drill"
    )
  );
}
