import type {
  ActionDirective,
  AttemptEvaluation,
  PaperReadiness,
  ProgressState,
  Question,
  Topic,
  TopicMastery,
  WeakTopicSignal,
} from "@/lib/domain/types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

function getAttemptAccuracy(attempt: AttemptEvaluation): number {
  if (attempt.maxScore === 0) return 0;
  return attempt.scoreAchieved / attempt.maxScore;
}

function getTopicAttempts(questions: Question[], attempts: AttemptEvaluation[], topicId: string): AttemptEvaluation[] {
  const questionIds = new Set(questions.filter((q) => q.topicId === topicId).map((q) => q.id));
  return attempts.filter((a) => questionIds.has(a.questionId));
}

function analyzeGaps(attempts: AttemptEvaluation[]): string[] {
  const gaps: string[] = [];
  if (attempts.length === 0) return gaps;

  const knowledgeMisses = attempts.filter((a) => a.missingKnowledgePoints.length > 0).length;
  const applicationMisses = attempts.filter((a) => a.weakApplicationToScenario).length;
  const commandWordMisses = attempts.filter((a) => a.poorCommandWordFulfillment).length;
  const evaluationMisses = attempts.filter((a) => a.lackOfEvaluationOrConclusion).length;

  const threshold = Math.max(1, Math.ceil(attempts.length * 0.4));

  if (knowledgeMisses >= threshold) gaps.push("Knowledge gaps");
  if (applicationMisses >= threshold) gaps.push("Application to context");
  if (commandWordMisses >= threshold) gaps.push("Command word technique");
  if (evaluationMisses >= threshold) gaps.push("Evaluation/Conclusion");

  return gaps;
}

export function buildTopicMastery(topics: Topic[], questions: Question[], attempts: AttemptEvaluation[]): TopicMastery[] {
  return topics.map((topic) => {
    const topicQuestions = questions.filter((q) => q.topicId === topic.id);
    const topicAttempts = getTopicAttempts(questions, attempts, topic.id);
    const attemptAccuracies = topicAttempts.map(getAttemptAccuracy);

    const coveragePercent =
      topicQuestions.length === 0
        ? 0
        : (new Set(topicAttempts.map((a) => a.questionId)).size / topicQuestions.length) * 100;

    const accuracyPercent = average(attemptAccuracies) * 100;

    const recentAttempts = topicAttempts.slice(-5);
    const earlierAttempts = topicAttempts.slice(0, Math.max(topicAttempts.length - recentAttempts.length, 0));
    const recentAccuracy = average(recentAttempts.map(getAttemptAccuracy)) * 100;
    const earlierAccuracy = average(earlierAttempts.map(getAttemptAccuracy)) * 100;
    const recentTrend = recentAttempts.length > 0 ? recentAccuracy - earlierAccuracy : 0;

    const frequentGaps = analyzeGaps(topicAttempts);

    // Standard scoring logic weighting accuracy slightly over coverage
    const masteryPercent = clamp(accuracyPercent * 0.72 + coveragePercent * 0.28);

    return {
      topicId: topic.id,
      title: topic.title,
      paper: topic.paper,
      masteryPercent,
      accuracyPercent,
      coveragePercent,
      attemptCount: topicAttempts.length,
      recentTrend,
      averageTimeRatio: 1, // Simplified for now until time estimation mapping is robust
      frequentGaps,
    };
  });
}

export function buildPaperReadiness(topics: Topic[], questions: Question[], attempts: AttemptEvaluation[]): PaperReadiness[] {
  const papers = Array.from(new Set(topics.map((t) => t.paper)));
  const mastery = buildTopicMastery(topics, questions, attempts);

  return papers.map((paper) => {
    const paperTopics = mastery.filter((t) => t.paper === paper);
    const readinessPercent = average(
      paperTopics.map((t) => t.masteryPercent * 0.8 + t.coveragePercent * 0.2),
    );

    return {
      paper,
      readinessPercent: clamp(readinessPercent),
      topicsCovered: paperTopics.filter((t) => t.coveragePercent > 0).length,
      totalTopics: paperTopics.length,
    };
  });
}

export function buildWeakTopicSignals(topics: Topic[], questions: Question[], attempts: AttemptEvaluation[]): WeakTopicSignal[] {
  const mastery = buildTopicMastery(topics, questions, attempts);

  return mastery
    .filter((topic) => topic.attemptCount > 0 || topic.coveragePercent > 0)
    .map((topic) => {
      const topicAttempts = getTopicAttempts(questions, attempts, topic.topicId);
      const repeatedMisses = topicAttempts.filter((a) => getAttemptAccuracy(a) < 0.5).length >= 2;
      const reasons: string[] = [];

      if (topic.accuracyPercent < 60) reasons.push("low accuracy");
      if (topic.coveragePercent < 50) reasons.push("light coverage");
      if (repeatedMisses) reasons.push("repeat misses");
      if (topic.recentTrend < -10) reasons.push("recent decline");

      if (topic.frequentGaps.length > 0) {
        reasons.push(...topic.frequentGaps.map(g => `Consistent failure: ${g}`));
      }

      // Stronger signal if there are explicit gap analysis failures
      const strength = clamp(
        (100 - topic.accuracyPercent) * 0.45 +
        (100 - topic.coveragePercent) * 0.2 +
        (repeatedMisses ? 15 : 0) +
        (topic.frequentGaps.length * 10) +
        (topic.recentTrend < 0 ? 8 : 0),
      );

      return {
        topicId: topic.topicId,
        title: topic.title,
        paper: topic.paper,
        strength,
        reasons,
        primaryGap: topic.frequentGaps[0] || null,
      };
    })
    .sort((left, right) => right.strength - left.strength);
}

export function buildActionDirectives(topics: Topic[], questions: Question[], progress: ProgressState): ActionDirective[] {
  const directives: ActionDirective[] = [];

  // 1. Mistake Queue Priority
  const pendingMistakes = progress.attempts.filter((a) => a.retryState === "pending");
  if (pendingMistakes.length > 0) {
    // Find the most recent or highest impact mistake
    const targetMistake = pendingMistakes[pendingMistakes.length - 1];
    const question = questions.find(q => q.id === targetMistake.questionId);

    // Deconstruct why they failed for precise directive
    let gapReason = "general factual drop";
    if (targetMistake.weakApplicationToScenario) gapReason = "application to context";
    else if (targetMistake.poorCommandWordFulfillment) gapReason = "command word structure";
    else if (targetMistake.lackOfEvaluationOrConclusion) gapReason = "missing conclusion/evaluation";

    if (question) {
      directives.push({
        id: `retry-${targetMistake.id}`,
        title: `Retry ${question.sectionName || "Exam Question"}`,
        reason: `Pending mistake retry. Focus required on: ${gapReason}.`,
        route: `/mistakes`,
        estimatedMinutes: 5,
        type: "mistake-retry",
        questionId: question.id,
      });
    }
  }

  // 2. Triage / Weakness Priority
  const weakSignals = buildWeakTopicSignals(topics, questions, progress.attempts);
  if (weakSignals[0]) {
    const primaryGapText = weakSignals[0].primaryGap ? ` (Gap: ${weakSignals[0].primaryGap})` : "";
    directives.push({
      id: `triage-${weakSignals[0].topicId}`,
      title: `Fix ${weakSignals[0].title}`,
      reason: `System flagged critical weakness${primaryGapText}.`,
      route: `/${weakSignals[0].paper}/${weakSignals[0].topicId}`,
      estimatedMinutes: 15,
      type: "triage-drill",
      topicId: weakSignals[0].topicId,
      paper: weakSignals[0].paper,
    });
  }

  // 3. Paper Readiness Priority
  const papers = buildPaperReadiness(topics, questions, progress.attempts);
  const weakestPaper = papers.sort((a, b) => a.readinessPercent - b.readinessPercent)[0];

  if (weakestPaper && weakestPaper.readinessPercent < 80) {
    const formattedPaperName = weakestPaper.paper === "paper-1" ? "Core Paper 1" :
      weakestPaper.paper === "paper-2" ? "Core Paper 2" :
        weakestPaper.paper.toUpperCase();
    directives.push({
      id: `boost-${weakestPaper.paper}`,
      title: `Boost ${formattedPaperName} Readiness`,
      reason: `Tracking below optimal limits at ${Math.round(weakestPaper.readinessPercent)}%.`,
      route: `/${weakestPaper.paper}`,
      estimatedMinutes: 25,
      type: "paper-prep",
      paper: weakestPaper.paper,
    });
  }

  // 4. Default Bootstrap for New Users
  if (directives.length === 0) {
    directives.push({
      id: "bootstrap-platform",
      title: "Begin Core Paper 1 Trace",
      reason: "Start your revision journey by taking the first Paper 1 diagnostic.",
      route: "/paper-1",
      estimatedMinutes: 10,
      type: "knowledge-bootstrap",
      paper: "paper-1",
    });
  }

  // Pad to at least 3 directives if needed by cycling next weaknesses
  const usedWeakTopicIds = new Set(directives.map((directive) => directive.topicId).filter(Boolean));
  const remainingWeakSignals = weakSignals.filter((signal) => !usedWeakTopicIds.has(signal.topicId));

  while (directives.length < 3 && remainingWeakSignals.length > 0) {
    const sig = remainingWeakSignals.shift();
    if (sig) {
      directives.push({
        id: `triage-${sig.topicId}`,
        title: `Review ${sig.title}`,
        reason: "Recommended based on coverage gaps.",
        route: `/${sig.paper}/${sig.topicId}`,
        estimatedMinutes: 10,
        type: "triage-drill",
        topicId: sig.topicId,
        paper: sig.paper,
      });
    } else {
      break;
    }
  }

  return directives.slice(0, 3);
}
