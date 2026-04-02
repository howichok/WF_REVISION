import assert from "node:assert/strict";
import test from "node:test";
import { clearInsertedCueEdits, undoLastRevisionEdit } from "./revision-edit-history";
import {
  canAcceptMicroRewrite,
  countInsertedCueTokens,
  isSafeMicroRewrite,
  stripInsertedCueTokens,
} from "./revision-improve-guards";
import { generateRevisionImprovement } from "./revision-improve";
import { REVISION_QUESTION_SCHEMAS } from "./rules/revision";
import {
  getPredictionFromRevisionEvaluation,
  getPredictionFromRevisionImprove,
  getRevisionPredictionBand,
} from "./revision-prediction";

test("safe micro rewrite guard only accepts short phrase replacements", () => {
  assert.equal(isSafeMicroRewrite("access-controlled", "secure"), true);
  assert.equal(isSafeMicroRewrite("this is now a full sentence.", "secure"), false);
  assert.equal(isSafeMicroRewrite("same", "same"), false);
});

test("canAcceptMicroRewrite requires replace changes with a safe target", () => {
  assert.equal(
    canAcceptMicroRewrite({
      id: "c1",
      kind: "replace",
      label: "Replace secure",
      targetText: "secure",
      replacementText: "Name the control.",
      rationale: "Too vague.",
      microRewriteText: "access-controlled",
    }),
    true
  );

  assert.equal(
    canAcceptMicroRewrite({
      id: "c2",
      kind: "add",
      label: "Add detail",
      replacementText: "Add detail.",
      rationale: "Missing detail.",
      microRewriteText: "extra words",
    }),
    false
  );
});

test("clearInsertedCueEdits removes only bracketed cue tokens", () => {
  const answer =
    "Confidentiality protects data [upgrade cue: name the access control] and integrity keeps it accurate.";
  const cleared = clearInsertedCueEdits(answer, []);

  assert.ok(cleared);
  assert.equal(
    cleared?.answer,
    "Confidentiality protects data and integrity keeps it accurate."
  );
  assert.equal(countInsertedCueTokens(cleared?.answer ?? ""), 0);
  assert.equal(
    stripInsertedCueTokens(
      "Line one [fix cue: add an effect]\nLine two [add cue: mention continuity]"
    ),
    "Line one\nLine two"
  );
});

test("undoLastRevisionEdit restores the previous machine-applied answer", () => {
  const undone = undoLastRevisionEdit([
    {
      kind: "insert-cue",
      previousAnswer: "Original answer",
      nextAnswer: "Original answer [upgrade cue: add a consequence]",
    },
  ]);

  assert.ok(undone);
  assert.equal(undone?.answer, "Original answer");
  assert.equal(undone?.history.length, 0);
});

test("prediction helpers classify score bands deterministically", () => {
  assert.equal(getRevisionPredictionBand(75), "distinction");
  assert.equal(getRevisionPredictionBand(55), "merit");
  assert.equal(getRevisionPredictionBand(25), "fail");

  const evaluationPrediction = getPredictionFromRevisionEvaluation({
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "revision-answer",
    questionId: "stub",
    topicId: "security",
    score: 3,
    maxScore: 6,
    matchedConcepts: [],
    missingConcepts: [],
    misconceptions: [],
    confidence: 0.5,
    feedback: "Stub",
    conceptBreakdown: [],
    misconceptionBreakdown: [],
  });
  assert.equal(evaluationPrediction.band, "merit");

  const improvementPrediction = getPredictionFromRevisionImprove({
    evaluationVersion: 1,
    evaluatedAt: new Date().toISOString(),
    mode: "revision-improve",
    questionId: "stub",
    topicId: "security",
    outputMode: "commentator",
    summary: "Stub",
    commentator: [],
    checklist: [],
    weakSpans: [],
    changes: [],
    basedOnScore: {
      score: 1,
      maxScore: 6,
      confidence: 0.3,
    },
  });
  assert.equal(improvementPrediction.band, "fail");
});

test("topic rewrite dictionaries add business-specific phrasing hints", () => {
  const schema = REVISION_QUESTION_SCHEMAS.find((item) => item.topicId === "business");
  assert.ok(schema, "Expected at least one business revision schema.");

  const response = generateRevisionImprovement({
    mode: "revision-improve",
    questionId: schema.id,
    answer: "The rollout helps the business because users like it.",
    outputMode: "diff",
  });

  assert.ok(
    response.changes.some(
      (change) =>
        change.microRewriteText === "supports continuity" ||
        change.microRewriteText === "improves adoption"
    )
  );
});
