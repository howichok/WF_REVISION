import type { EspGenericLessonStep } from "@/data/esp/steps/types";
import { DEFECT_PIPELINE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task2/defect-pipeline-scene";
import { TEST_TABLE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task2/test-table-scene";
import { FIX_CARDS_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task2/fix-cards-scene";
import { PRACTICE_UPLOAD_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/practice-upload-scene";

export const TASK2_STEPS: EspGenericLessonStep[] = [
  {
    id: "intro",
    number: 1,
    label: "Fault first",
    emoji: "🐛",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Reproduce before you refactor.",
    lead: "Task 2 marks your discipline: show the defect, show the fix, show tests that prove both.",
    keyPoints: [
      "Run the starter code and capture the wrong output.",
      "Change the smallest line that explains the bug.",
      "Re-run normal, boundary, and invalid data after the fix.",
    ],
    takeaway: "A fix without a failing test first looks like a guess.",
    scene: { id: "task2-defect-pipeline" },
    beats: DEFECT_PIPELINE_BEATS,
  },
  {
    id: "tests",
    number: 2,
    label: "Test log",
    emoji: "📒",
    duration: "3 min",
    durationMs: 150_000,
    headline: "The log is the mark scheme you write yourself.",
    lead: "Use a table: purpose, input, expected, actual, outcome. Examiners scan for boundary + invalid cases.",
    keyPoints: [
      "Purpose names the scenario (normal / boundary / invalid).",
      "Expected should be justified — show your working for calculations.",
      "Actual must be copied from the run, not imagined.",
    ],
    weak: { label: "Weak log", example: "It works now." },
    strong: { label: "Strong log", example: "Invalid row ‘abc’ raises ValueError — matches brief validation rule." },
    takeaway: "Three rows minimum: happy path, edge, garbage in.",
    scene: { id: "task2-test-table" },
    beats: TEST_TABLE_BEATS,
  },
  {
    id: "hygiene",
    number: 3,
    label: "Fix discipline",
    emoji: "🧹",
    duration: "2 min",
    durationMs: 120_000,
    headline: "The smallest fix that explains the bug.",
    lead: "Bounce candidate fixes off the bug. Take only the one that actually maps to the defect.",
    keyPoints: [
      "Stylistic rewrites are not fixes.",
      "Prefer a one-line change if it matches the root cause.",
      "Re-run the tests — every time — after a change.",
    ],
    takeaway: "If another developer cannot follow your diff, you will lose communication marks.",
    scene: { id: "task2-fix-cards" },
    beats: FIX_CARDS_BEATS,
  },
  {
    id: "practice",
    number: 4,
    label: "Your turn",
    emoji: "🎯",
    duration: "Your time",
    durationMs: 60_000,
    headline: "Download the Task 2 template, fix the code offline, upload for feedback.",
    lead: "Work in VS Code / IDLE. Bring the completed Word template or your .py plus evidence back here.",
    keyPoints: [
      "Template includes starter code and a test table.",
      "Upload .docx and/or .py — multiple files allowed.",
    ],
    takeaway: "Submit when your log shows three disciplined tests.",
    scene: { id: "practice-upload", data: { taskId: "task_2" } },
    beats: PRACTICE_UPLOAD_BEATS,
  },
];
