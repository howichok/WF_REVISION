import test from "node:test";
import assert from "node:assert/strict";
import { examAnswerNeedsGeminiMark } from "@/lib/exam-marking-ambiguity";
import type { ExamConditionsQuestion } from "@/lib/exam-conditions";

function q(marks: number): ExamConditionsQuestion {
  return {
    id: "t1",
    topicId: "x",
    title: "T",
    prompt: "P",
    sourceLabel: "S",
    marks,
    questionType: "short-open",
    difficulty: "medium",
    expectation: "E",
    acceptableAnswers: [],
    markSchemeSummary: "",
  };
}

function loc(scorePercent: number, confidence: number, verdict = "partial") {
  return {
    score: 2,
    maxScore: 4,
    scorePercent,
    evaluation: { confidence, verdict },
  };
}

test("empty answer never needs Gemini", () => {
  assert.equal(examAnswerNeedsGeminiMark(q(4), "   ", loc(0, 0)), false);
});

test("very high local score skips Gemini", () => {
  assert.equal(examAnswerNeedsGeminiMark(q(4), "good answer text here", loc(95, 90, "strong")), false);
});

test("borderline score needs Gemini", () => {
  assert.equal(examAnswerNeedsGeminiMark(q(4), "some answer", loc(45, 50)), true);
});

test("long answer needs Gemini", () => {
  const long = "word ".repeat(200);
  assert.equal(examAnswerNeedsGeminiMark(q(4), long, loc(95, 90, "strong")), true);
});

test("high-mark question needs Gemini even with decent score", () => {
  assert.equal(examAnswerNeedsGeminiMark(q(8), "short", loc(95, 90, "strong")), true);
});
