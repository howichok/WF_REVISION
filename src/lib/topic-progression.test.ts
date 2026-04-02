import assert from "node:assert/strict";
import test from "node:test";
import {
  getAnswerCheckNextStepRecommendations,
  getAskNextStepRecommendations,
  getExamDrillNextStepRecommendations,
  getQuizNextStepRecommendations,
  getRecallNextStepRecommendations,
  getTopicPracticeStudioRecommendation,
} from "./topic-progression";
import {
  recordAnswerCheckTopicCoaching,
  recordExamDrillTopicCoaching,
} from "./coaching-memory";
import type { TopicIntelligenceResponse } from "./intelligence/types";

function buildPracticeProgressEntry(
  topicId: string,
  entityId: string,
  progressPercent: number
) {
  return {
    id: `${topicId}-${entityId}`,
    topicId,
    entityId,
    entityType: "practice-set" as const,
    status: progressPercent >= 100 ? "completed" : progressPercent > 0 ? "in-progress" : "not-started",
    progressPercent,
    completedAt: progressPercent >= 100 ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    lastInteractedAt: new Date().toISOString(),
  };
}

function buildAssistantResult(
  intent: TopicIntelligenceResponse["intent"]
): TopicIntelligenceResponse {
  return {
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "topic-assistant",
    provider: "local-rule-engine",
    topicId: "security",
    query: "confidentiality",
    intent,
    confidence: "high",
    confidenceScore: 32,
    answer: "Stub answer.",
    examSafeFocus: ["one", "two", "three"],
    misconceptions: [],
    suggestedNextAction: null,
    sources: [
      {
        id: "official-1",
        title: "Pearson source",
        type: "official-resource",
        href: "https://qualifications.pearson.com/example",
        host: "qualifications.pearson.com",
      },
    ],
    relatedQuestions: [
      {
        id: "security-cia-triad-balance",
        title: "Written answer prompt",
        prompt: "Explain how confidentiality protects data.",
        sourceLabel: "Answer check rubric",
        href: "/revision/security/answer-check?questionId=security-cia-triad-balance",
        marks: 6,
        kind: "answer-check",
      },
      {
        id: "exam-drill-paper2-2023-q2b-cia-patient-records",
        title: "Security drill",
        prompt: "Explain why access control matters.",
        sourceLabel: "Official point 8.2",
        href: "/revision/security/exam-drill?drillId=exam-drill-paper2-2023-q2b-cia-patient-records",
        marks: 4,
        kind: "exam-drill",
      },
    ],
    relatedResources: [],
    officialConfirmationStatus: "not-needed",
    localOnly: true,
  };
}

test("practice studio recommendation stays on ask first when no practice has started", () => {
  const recommendation = getTopicPracticeStudioRecommendation("security", []);
  assert.equal(recommendation.suggestedMode, "ask");
});

test("practice studio recommendation forces ask after repeated same-topic failures", () => {
  const memory = recordAnswerCheckTopicCoaching({}, {
    topicId: "security",
    questionId: "security-cia-triad-balance",
    pointId: "security-cia-triad-balance",
    scorePercent: 20,
  });
  const updatedMemory = recordAnswerCheckTopicCoaching(memory, {
    topicId: "security",
    questionId: "security-cia-triad-balance",
    pointId: "security-cia-triad-balance",
    scorePercent: 18,
  });

  const recommendation = getTopicPracticeStudioRecommendation("security", [], updatedMemory);
  assert.equal(recommendation.suggestedMode, "ask");
});

test("practice studio recommendation escalates through recall, exam-drill, quiz, then answer-check", () => {
  assert.equal(
    getTopicPracticeStudioRecommendation("security", [
      buildPracticeProgressEntry("security", "practice:recall:security", 10),
    ]).suggestedMode,
    "recall"
  );
  assert.equal(
    getTopicPracticeStudioRecommendation("security", [
      buildPracticeProgressEntry("security", "practice:recall:security", 70),
      buildPracticeProgressEntry("security", "practice:exam-drill:security", 20),
    ]).suggestedMode,
    "exam-drill"
  );
  assert.equal(
    getTopicPracticeStudioRecommendation("security", [
      buildPracticeProgressEntry("security", "practice:recall:security", 70),
      buildPracticeProgressEntry("security", "practice:exam-drill:security", 70),
      buildPracticeProgressEntry("security", "practice:quiz:security", 20),
    ]).suggestedMode,
    "quiz"
  );
  assert.equal(
    getTopicPracticeStudioRecommendation("security", [
      buildPracticeProgressEntry("security", "practice:recall:security", 80),
      buildPracticeProgressEntry("security", "practice:exam-drill:security", 80),
      buildPracticeProgressEntry("security", "practice:quiz:security", 80),
    ]).suggestedMode,
    "answer-check"
  );
});

test("answer-check fail routes into same-topic replay before anything else", () => {
  const recommendations = getAnswerCheckNextStepRecommendations({
    topicId: "security",
    questionId: "security-cia-triad-balance",
    scorePercent: 25,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.includes("/revision/security/exam-drill"));
  assert.ok(recommendations.primary?.href.includes("drillId="));
  assert.ok(recommendations.secondary?.href.includes("/revision/security/ask?"));
});

test("answer-check merit routes into a harder same-topic written answer", () => {
  const recommendations = getAnswerCheckNextStepRecommendations({
    topicId: "security",
    questionId: "security-cia-triad-balance",
    scorePercent: 55,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.includes("/revision/security/answer-check?questionId="));
  assert.ok(recommendations.secondary?.href.includes("/revision/security/exam-drill"));
});

test("answer-check distinction routes into the next uncovered same-topic point", () => {
  const recommendations = getAnswerCheckNextStepRecommendations({
    topicId: "security",
    questionId: "security-cia-triad-balance",
    scorePercent: 82,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.includes("/revision/security/exam-drill"));
  assert.ok(!recommendations.primary?.href.includes("/weak-areas"));
});

test("exam-drill needs-work replays the same topic before moving on", () => {
  const recommendations = getExamDrillNextStepRecommendations({
    topicId: "security",
    drillId: "exam-drill-paper2-2023-q2b-cia-patient-records",
    lastRating: "needs-work",
    readinessPercent: 35,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.includes("/revision/security/exam-drill"));
  assert.ok(recommendations.secondary?.href.includes("/revision/security/ask?"));
});

test("exam-drill ready routes into answer-check for the same topic", () => {
  const recommendations = getExamDrillNextStepRecommendations({
    topicId: "security",
    drillId: "exam-drill-paper2-2023-q2b-cia-patient-records",
    lastRating: "ready",
    readinessPercent: 85,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.includes("/revision/security/answer-check?questionId="));
});

test("exam-drill repeated weak area forces a scaffold before another replay", () => {
  const memory = recordExamDrillTopicCoaching({}, {
    topicId: "security",
    drillId: "exam-drill-paper2-2023-q2b-cia-patient-records",
    pointId: "dsd-1.4",
    readinessPercent: 32,
    rating: "needs-work",
  });
  const updatedMemory = recordExamDrillTopicCoaching(memory, {
    topicId: "security",
    drillId: "exam-drill-paper2-2023-q2b-cia-patient-records",
    pointId: "dsd-1.4",
    readinessPercent: 35,
    rating: "needs-work",
  });

  const recommendations = getExamDrillNextStepRecommendations({
    topicId: "security",
    drillId: "exam-drill-paper2-2023-q2b-cia-patient-records",
    lastRating: "needs-work",
    readinessPercent: 35,
    revisionProgress: [],
    coachingMemory: updatedMemory,
  });

  assert.ok(recommendations.primary?.href.includes("/revision/security/ask?"));
});

test("ask results stay same-topic-first for local guidance", () => {
  const recommendations = getAskNextStepRecommendations({
    topicId: "security",
    result: buildAssistantResult("local-answer"),
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.startsWith("/revision/security/"));
  assert.ok(recommendations.secondary?.href.startsWith("/revision/security/"));
});

test("ask resource results can still surface an official source without leaving the topic loop", () => {
  const recommendations = getAskNextStepRecommendations({
    topicId: "security",
    result: {
      ...buildAssistantResult("resource-pick"),
      officialConfirmationStatus: "confirmed",
      localOnly: false,
    },
    revisionProgress: [],
  });

  assert.equal(recommendations.primary?.actionKind, "external");
  assert.ok(recommendations.secondary?.href.startsWith("/revision/security/"));
});

test("recall recommendations stay same-topic-first", () => {
  const recommendations = getRecallNextStepRecommendations({
    topicId: "security",
    masteryPercent: 78,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.startsWith("/revision/security/"));
});

test("quiz recommendations stay same-topic-first", () => {
  const recommendations = getQuizNextStepRecommendations({
    topicId: "security",
    scorePercent: 52,
    revisionProgress: [],
  });

  assert.ok(recommendations.primary?.href.startsWith("/revision/security/"));
});
