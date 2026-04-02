import assert from "node:assert/strict";
import test from "node:test";
import {
  CURRICULUM_POINT_COVERAGE_NODES,
  DSD_CURRICULUM_POINTS,
  GENERATED_POINT_QUESTION_METADATA,
  TOPIC_COVERAGE_GRAPHS,
} from ".";

test("every official curriculum point has the expected generated question depth", () => {
  for (const point of DSD_CURRICULUM_POINTS) {
    const generatedForPoint = GENERATED_POINT_QUESTION_METADATA.filter((question) =>
      question.curriculumPointIds.includes(point.id)
    );
    const hasPriorityTopic = generatedForPoint.some((question) =>
      question.legacyTopicIds.some((topicId) =>
        ["intro-programming", "business", "digital-environments"].includes(topicId)
      )
    );

    assert.equal(
      generatedForPoint.length,
      hasPriorityTopic ? 8 : 6,
      `Expected generated prompt depth for ${point.id}`
    );
  }
});

test("generated questions keep single-point mapping and non-empty topic mapping", () => {
  const ids = new Set<string>();

  for (const question of GENERATED_POINT_QUESTION_METADATA) {
    assert.equal(
      question.curriculumPointIds.length,
      1,
      `Expected a single curriculum point for ${question.id}`
    );
    assert.ok(question.legacyTopicIds.length > 0, `Expected topic mapping for ${question.id}`);
    assert.ok(!ids.has(question.id), `Duplicate generated question id ${question.id}`);
    ids.add(question.id);
  }
});

test("coverage graph includes generated variants for every covered point", () => {
  for (const node of CURRICULUM_POINT_COVERAGE_NODES) {
    assert.ok(node.generatedQuestionIds.length >= 6, `Expected generated prompts for ${node.pointId}`);
    assert.ok(node.generatedVariants.length >= 6, `Expected generated variants for ${node.pointId}`);
  }
});

test("all topic graphs surface universal misconception or trade-off prompts", () => {
  for (const topicId of TOPIC_COVERAGE_GRAPHS.map((entry) => entry.topicId)) {
    const graph = TOPIC_COVERAGE_GRAPHS.find((entry) => entry.topicId === topicId);
    assert.ok(graph, `Expected coverage graph for ${topicId}`);
    assert.ok(
      graph.coverageByPoint.some(
        (node) =>
          node.generatedVariants.includes("evaluate-tradeoff") ||
          node.generatedVariants.includes("fix-misconception")
      ),
      `Expected curated prompt depth somewhere inside ${topicId}`
    );
  }
});

test("priority weak-topic graphs still surface design and risk variants", () => {
  for (const topicId of ["intro-programming", "business", "digital-environments"] as const) {
    const graph = TOPIC_COVERAGE_GRAPHS.find((entry) => entry.topicId === topicId);
    assert.ok(graph, `Expected coverage graph for ${topicId}`);
    assert.ok(
      graph.coverageByPoint.some(
        (node) =>
          node.generatedVariants.includes("design-decision") ||
          node.generatedVariants.includes("risk-priority")
      ),
      `Expected deeper design/risk prompts somewhere inside ${topicId}`
    );
  }
});

test("every topic coverage graph exposes generated questions and point coverage", () => {
  for (const graph of TOPIC_COVERAGE_GRAPHS) {
    assert.ok(graph.coverageByPoint.length > 0, `Expected covered points for topic ${graph.topicId}`);
    assert.ok(
      graph.generatedQuestionCount > 0,
      `Expected generated prompts for topic ${graph.topicId}`
    );
    assert.ok(
      graph.totalQuestionCount >= graph.generatedQuestionCount,
      `Expected total questions to include generated prompts for ${graph.topicId}`
    );
  }
});

test("all coverage nodes include coaching metadata for each covered point", () => {
  for (const graph of TOPIC_COVERAGE_GRAPHS) {
    assert.ok(graph, `Expected a coverage graph for ${graph.topicId}`);

    for (const node of graph.coverageByPoint) {
      assert.ok(node.misconceptionSignals.length > 0, `Expected misconception signals for ${node.pointId}`);
      assert.ok(node.rewriteRules.length > 0, `Expected rewrite rules for ${node.pointId}`);
      assert.ok(node.resourcePriorityIds.length > 0, `Expected resource priority ids for ${node.pointId}`);
      assert.ok(node.followUpQuestionIds.length > 0, `Expected follow-up questions for ${node.pointId}`);
      assert.ok(node.commandWordTargets.length > 0, `Expected command-word targets for ${node.pointId}`);
      assert.ok(node.improvementSignals.length > 0, `Expected improvement signals for ${node.pointId}`);
    }
  }
});
