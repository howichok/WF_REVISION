import test from "node:test";
import assert from "node:assert/strict";
import { mergeGeminiExamMarking } from "@/lib/exam-conditions";
import type { ExamConditionsQuestion, GeminiExamMarkResponse } from "@/lib/exam-conditions";
import {
  ensureCompleteGeminiItems,
  geminiVsLocalLowConfidence,
  markDriftThreshold,
  parseItemLevel,
  reconcileOverallBand,
} from "@/lib/exam-conditions-marking-post";

function minimalQuestion(id: string, marks = 4): ExamConditionsQuestion {
  return {
    id,
    topicId: "topic-test",
    title: "Test",
    prompt: "Explain testing.",
    sourceLabel: "Test",
    marks,
    questionType: "short-open",
    difficulty: "medium",
    expectation: "Student explains the concept.",
    acceptableAnswers: ["test"],
    markSchemeSummary: "",
  };
}

test("parseItemLevel normalises unknown values to none", () => {
  assert.equal(parseItemLevel("clear"), "clear");
  assert.equal(parseItemLevel("nonsense"), "none");
});

test("reconcileOverallBand overrides when model band is far from numeric percent", () => {
  const out = reconcileOverallBand("Pass", 92, 1);
  assert.equal(out.overridden, true);
  assert.ok(out.displayBand.includes("aligned"));
});

test("reconcileOverallBand keeps model label when within one step", () => {
  const out = reconcileOverallBand("Merit", 60, 1);
  assert.equal(out.overridden, false);
  assert.equal(out.displayBand, "Merit");
});

test("markDriftThreshold scales with max marks", () => {
  assert.equal(markDriftThreshold(4), 1);
  assert.equal(markDriftThreshold(10), 3);
});

test("geminiVsLocalLowConfidence flags large gaps", () => {
  assert.equal(geminiVsLocalLowConfidence(4, 0, 4), true);
  assert.equal(geminiVsLocalLowConfidence(3, 3, 4), false);
});

test("ensureCompleteGeminiItems preserves first row per id and fills gaps", () => {
  const questions = [minimalQuestion("q1"), minimalQuestion("q2")];
  const gemini: GeminiExamMarkResponse = {
    band: "Pass",
    oneLiner: "ok",
    examinerNote: "",
    items: [
      {
        id: "q1",
        m: 2,
        why: "ok",
        evidence: [],
        hit: ["a"],
        miss: [],
        fb: "fb",
        level: "basic",
      },
    ],
  };

  const filled = ensureCompleteGeminiItems(
    gemini,
    questions,
    { q1: "partial", q2: "something" },
    () => ({
      score: 1,
      evaluation: {
        matchedSlots: ["x"],
        missingSlots: ["y"],
        feedback: "local",
      },
    })
  );

  assert.equal(filled.length, 2);
  assert.equal(filled[0].id, "q1");
  assert.equal(filled[0].m, 2);
  assert.equal(filled[1].id, "q2");
  assert.ok(filled[1].why.includes("local"));
});

test("ensureCompleteGeminiItems keeps first duplicate id only", () => {
  const questions = [minimalQuestion("q1")];
  const gemini: GeminiExamMarkResponse = {
    band: "Pass",
    oneLiner: "ok",
    examinerNote: "",
    items: [
      { id: "q1", m: 1, why: "a", evidence: [], hit: [], miss: [], fb: "f", level: "none" },
      { id: "q1", m: 3, why: "b", evidence: [], hit: [], miss: [], fb: "f", level: "none" },
    ],
  };

  const filled = ensureCompleteGeminiItems(gemini, questions, { q1: "x" }, () => ({
    score: 0,
    evaluation: { matchedSlots: [], missingSlots: [], feedback: "" },
  }));

  assert.equal(filled[0].m, 1);
});

test("mergeGeminiExamMarking clamps marks and can override overall band", () => {
  const questions = [minimalQuestion("q1", 4)];
  const gemini: GeminiExamMarkResponse = {
    band: "Pass",
    oneLiner: "Summary",
    examinerNote: "AI note",
    items: [
      {
        id: "q1",
        m: 99,
        why: "Too high from model",
        evidence: ["quoted"],
        hit: ["h"],
        miss: ["m"],
        fb: "Feedback",
        level: "detailed",
      },
    ],
  };

  const result = mergeGeminiExamMarking(questions, { q1: "A full answer." }, gemini);
  assert.equal(result.reviews[0].score, 4);
  assert.equal(result.bandOverriddenToMatchMarks, true);
  assert.ok(result.overallBand.includes("Strong"));
  assert.ok(result.examinerNote);
  assert.ok(result.reviews[0].geminiMarking?.why);
  assert.equal(result.reviews[0].geminiMarking?.evidence[0], "quoted");
});
