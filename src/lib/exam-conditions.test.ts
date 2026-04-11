import test from "node:test";
import assert from "node:assert/strict";
import type { QuestionMetadata } from "@/data/curriculum";
import {
  generateExamConditionsSession,
  getExamConditionsPoolStats,
} from "./exam-conditions";
import { getLocalSharedCurriculumSnapshot } from "./shared-curriculum";

test("exam conditions excludes worksheet micro-drills from the timed paper", () => {
  const session = generateExamConditionsSession("data", { setSize: 10 });
  const prompts = session.questions.map((question) => question.prompt).join("\n");

  assert.equal(prompts.includes("Name;Age;Country"), false);
  assert.equal(prompts.toLowerCase().includes("format for this snippet"), false);
  assert.equal(
    session.questions.some((question) => question.id.startsWith("teach-pack-format-snippet-")),
    false
  );
});

test("exam conditions uses Supabase snapshot source kinds when deciding exam stems", () => {
  const local = getLocalSharedCurriculumSnapshot();
  const remotePastPaperQuestion: QuestionMetadata = {
    id: "remote-db-paper-q1",
    sourceId: "remote-db-paper",
    title: "Remote DB exam question",
    sourceLabel: "Remote DB Paper",
    year: 2026,
    paper: "Paper 2",
    marks: 8,
    questionType: "extended-response",
    summary: "Evaluate how a development team should manage risk during a staged software rollout.",
    expectation:
      "Strong answers balance risk, user impact, communication, testing, and rollback planning.",
    curriculumPointIds: ["dsd-1.4"],
    legacyTopicIds: ["problem-solving"],
    practicePrompt:
      "Practice wording that should not appear when the source is a Supabase-only past paper.",
    markSchemeConceptIds: [],
  };

  const session = generateExamConditionsSession("problem-solving", {
    setSize: 10,
    snapshot: {
      ...local,
      origin: "supabase",
      sources: [
        {
          id: "remote-db-paper",
          title: "Remote DB Paper",
          kind: "past-paper",
          classification: "primary",
          filePath: "supabase://remote-db-paper",
          year: 2026,
          notes: "Test-only Supabase source.",
        },
      ],
      questions: [remotePastPaperQuestion],
    },
  });

  assert.equal(session.questionCount, 1);
  assert.equal(session.questions[0]?.stemOrigin, "past-paper");
  assert.equal(session.questions[0]?.prompt, remotePastPaperQuestion.summary);
});

test("pool stats count only exam-worthy questions", () => {
  const stats = getExamConditionsPoolStats("data");

  assert.equal(stats.poolSize > 0, true);
  assert.equal(stats.poolSize < getLocalSharedCurriculumSnapshot().questions.length, true);
});
