import assert from "node:assert/strict";
import test from "node:test";
import { REVISION_QUESTION_SCHEMAS } from "./rules/revision";
import {
  generateRevisionImprovement,
  generateRevisionImprovementResponse,
} from "./revision-improve";

test("builds commentator and weak spans for a thin answer", () => {
  const schema = REVISION_QUESTION_SCHEMAS.find((item) => item.topicId === "security");
  assert.ok(schema, "Expected at least one security revision schema.");

  const response = generateRevisionImprovement({
    mode: "revision-improve",
    questionId: schema.id,
    answer: "Confidentiality is important because it keeps data safe.",
    outputMode: "commentator",
  });

  assert.equal(response.mode, "revision-improve");
  assert.equal(response.outputMode, "commentator");
  assert.equal(response.commentator.length, 3);
  assert.ok(response.weakSpans.length > 0);
  assert.ok(response.changes.length > 0);
  assert.ok(
    response.changes.some((change) => change.kind === "replace" && change.microRewriteText)
  );
});

test("builds diff-friendly changes when diff mode is requested", () => {
  const schema = REVISION_QUESTION_SCHEMAS.find((item) => item.topicId === "security");
  assert.ok(schema, "Expected at least one security revision schema.");

  const response = generateRevisionImprovement({
    mode: "revision-improve",
    questionId: schema.id,
    answer:
      "Confidentiality means data is private and secure, which is good for the system.",
    outputMode: "diff",
  });

  assert.equal(response.outputMode, "diff");
  assert.ok(response.changes.some((change) => change.kind === "replace"));
  assert.ok(response.checklist.length >= 3);
});

test("applies Gemini polish without changing deterministic weak spans", async () => {
  const schema = REVISION_QUESTION_SCHEMAS.find((item) => item.topicId === "security");
  assert.ok(schema, "Expected at least one security revision schema.");

  const response = await generateRevisionImprovementResponse(
    {
      mode: "revision-improve",
      questionId: schema.id,
      answer:
        "Confidentiality is important because it keeps data safe for users, but my answer is still vague and does not name a control, the impact on the system, or the difference between privacy, authentication, and access control in the scenario clearly.",
      outputMode: "diff",
    },
    {
      polishResolver: async ({ localImprovement }) => ({
        provider: "gemini-coach",
        model: "stub-gemini",
        summary: "Tighten the wording and add one missing technical detail.",
        commentator: [
          "Name the exact control, not just the effect.",
          "Add one missing mark-scheme idea.",
          "Use precise security language.",
        ],
        checklist: [
          "Answer the command word directly.",
          "Add the missing idea.",
          "Use exact security terminology.",
        ],
        changes: localImprovement.changes.map((change) => ({
          id: change.id,
          replacementText: `Polished: ${change.replacementText}`,
          rationale: "Gemini tightened the hint wording.",
          microRewriteText: change.microRewriteText ? "precise-term" : undefined,
        })),
        outOfScope: false,
      }),
    }
  );

  assert.equal(response.provider, "gemini-coach");
  assert.equal(response.model, "stub-gemini");
  assert.ok(response.summary.startsWith("Tighten"));
  assert.ok(response.weakSpans.length > 0);
  assert.ok(response.changes.some((change) => change.replacementText.startsWith("Polished:")));
  assert.ok(response.changes.some((change) => change.microRewriteText === "precise-term"));
});

test("falls back to local improvement when Gemini polish is out of scope", async () => {
  const schema = REVISION_QUESTION_SCHEMAS.find((item) => item.topicId === "security");
  assert.ok(schema, "Expected at least one security revision schema.");

  const response = await generateRevisionImprovementResponse(
    {
      mode: "revision-improve",
      questionId: schema.id,
      answer: "Confidentiality is important because it keeps data safe.",
      outputMode: "commentator",
    },
    {
      polishResolver: async () => ({
        provider: "gemini-coach",
        model: "stub-gemini",
        summary: "Ignore this.",
        commentator: [],
        checklist: [],
        changes: [],
        outOfScope: true,
      }),
    }
  );

  assert.equal(response.provider, "local-rule-engine");
  assert.equal(response.model, undefined);
  assert.ok(response.commentator.length > 0);
});

test("keeps short answers local-only and skips Gemini polish", async () => {
  const schema = REVISION_QUESTION_SCHEMAS.find((item) => item.topicId === "security");
  assert.ok(schema, "Expected at least one security revision schema.");

  let called = false;
  const response = await generateRevisionImprovementResponse(
    {
      mode: "revision-improve",
      questionId: schema.id,
      answer: "Confidentiality keeps data safe and private for users.",
      outputMode: "commentator",
    },
    {
      polishResolver: async () => {
        called = true;
        throw new Error("This resolver should not run for short answers.");
      },
    }
  );

  assert.equal(called, false);
  assert.equal(response.provider, "local-rule-engine");
  assert.equal(response.model, undefined);
});
