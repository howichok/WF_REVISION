import type { EspGenericLessonStep } from "@/data/esp/steps/types";
import { EVAL_MATRIX_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task4b/eval-matrix-scene";
import { RATIONALE_COMPARE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/rationale-compare-scene";
import { PRACTICE_UPLOAD_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/practice-upload-scene";

export const TASK4B_STEPS: EspGenericLessonStep[] = [
  {
    id: "lens",
    number: 1,
    label: "Evidence matrix",
    emoji: "⚖️",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Judge against requirements — and point at evidence.",
    lead: "Task 4b is reflective. Every judgement you make must reference a test, log, or artefact produced earlier.",
    keyPoints: [
      "System vs user requirements — separate them.",
      "Each judgement needs a test, log, or artefact reference.",
      "Honest limitations earn marks — generic praise does not.",
    ],
    takeaway: "Replace ‘it works well’ with ‘requirement R3 passed test T5’.",
    scene: { id: "task4b-eval-matrix" },
    beats: EVAL_MATRIX_BEATS,
  },
  {
    id: "limits",
    number: 2,
    label: "Limits & improvements",
    emoji: "🔭",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Show professional judgement.",
    lead: "Name a limitation, explain impact, propose an improvement that follows logically.",
    keyPoints: [
      "Limitations should be specific (data, UX edge case, performance).",
      "Improvements must be proportionate — no fantasy rewrites.",
      "Link improvements back to client risk.",
    ],
    takeaway: "Examiners reward disciplined critique, not self-deprecation.",
    scene: { id: "task4b-eval-compare" },
    beats: RATIONALE_COMPARE_BEATS,
  },
  {
    id: "practice",
    number: 3,
    label: "Your turn",
    emoji: "🎯",
    duration: "Your time",
    durationMs: 60_000,
    headline: "Complete the evaluation template and upload.",
    lead: "Use the structured headings — they keep you honest against the mark scheme.",
    keyPoints: [
      "Download Task 4b Word template.",
      "Reference evidence from earlier tasks explicitly.",
      "Upload .docx for rubric feedback.",
    ],
    takeaway: "Evaluation without evidence references reads as opinion.",
    scene: { id: "practice-upload", data: { taskId: "task_4b" } },
    beats: PRACTICE_UPLOAD_BEATS,
  },
];
