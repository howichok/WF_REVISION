import test from "node:test";
import assert from "node:assert/strict";
import { parseGeminiExamMarkPolicy } from "@/lib/exam-marking-ai-gate";

test("defaults to ai policy when env unset", () => {
  const prev = process.env.GEMINI_EXAM_MARK_POLICY;
  delete process.env.GEMINI_EXAM_MARK_POLICY;
  assert.equal(parseGeminiExamMarkPolicy(), "ai");
  if (prev !== undefined) process.env.GEMINI_EXAM_MARK_POLICY = prev;
});

test("local aliases force local policy", () => {
  const prev = process.env.GEMINI_EXAM_MARK_POLICY;
  process.env.GEMINI_EXAM_MARK_POLICY = "off";
  assert.equal(parseGeminiExamMarkPolicy(), "local");
  if (prev !== undefined) process.env.GEMINI_EXAM_MARK_POLICY = prev;
  else delete process.env.GEMINI_EXAM_MARK_POLICY;
});
