import type { EspGenericLessonStep } from "@/data/esp/steps/types";
import { BUILD_QUADRANT_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task4a/build-quadrant-scene";
import { RUN_PIPELINE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task4a/run-pipeline-scene";
import { UNIT_TEST_CHECKLIST_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task4a/unit-test-checklist-scene";
import { COVERAGE_TABLE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task4a/coverage-table-scene";
import { PRACTICE_UPLOAD_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/practice-upload-scene";

export const TASK4A_STEPS: EspGenericLessonStep[] = [
  {
    id: "scope",
    number: 1,
    label: "Scope the feature",
    emoji: "🎯",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Build one feature extremely well.",
    lead: "Task 4a is about evidence: code, tests, data, reflection — all aligned to the scenario feature hint.",
    keyPoints: [
      "State the user story in your own words.",
      "Tie it to a column or rule in the CSV.",
      "Avoid scope creep — finish one path end-to-end.",
    ],
    takeaway: "Half-working breadth loses to narrow, evidenced depth.",
    scene: { id: "task4a-build-quadrant" },
    beats: BUILD_QUADRANT_BEATS,
  },
  {
    id: "evidence",
    number: 2,
    label: "Run it live",
    emoji: "▶️",
    duration: "3 min",
    durationMs: 160_000,
    headline: "Run the pipeline end-to-end — break it, fix it, re-run it.",
    lead: "Markers reward candidates who can show a shell-visible run and a minimal fix.",
    keyPoints: [
      "Screenshots of the shell are gold — keep them.",
      "Log what each stage printed.",
      "Fix the smallest unit that produces the failing log.",
    ],
    takeaway: "A run that failed once and now passes is stronger evidence than a 'works first time' claim.",
    scene: { id: "task4a-run-pipeline" },
    beats: RUN_PIPELINE_BEATS,
  },
  {
    id: "tests",
    number: 3,
    label: "Unit tests",
    emoji: "🧪",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Tests are the mark scheme you write for yourself.",
    lead: "Name your tests after behaviours, not functions. Cover normal, edge, and invalid data.",
    keyPoints: [
      "Happy path — at least one normal case.",
      "Edge case — empty input, boundary values.",
      "Invalid — data that must be rejected.",
    ],
    takeaway: "Five green tests beat a paragraph describing what 'should' work.",
    scene: { id: "task4a-unit-test-checklist" },
    beats: UNIT_TEST_CHECKLIST_BEATS,
  },
  {
    id: "coverage",
    number: 4,
    label: "Coverage matrix",
    emoji: "🎯",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Each requirement must point to at least one test.",
    lead: "A coverage table is the fastest way to prove every system requirement is evidenced.",
    keyPoints: [
      "List requirements as rows.",
      "Attach the test(s) that back them in the second column.",
      "An uncovered requirement is a lost mark.",
    ],
    takeaway: "If nothing points to a requirement, it is not proven — regardless of how good the code reads.",
    scene: { id: "task4a-coverage-table" },
    beats: COVERAGE_TABLE_BEATS,
  },
  {
    id: "practice",
    number: 5,
    label: "Your turn",
    emoji: "🎯",
    duration: "Your time",
    durationMs: 60_000,
    headline: "Upload your Word evidence pack.",
    lead: "Submit the document plus any screenshots. You will see deterministic structure results and AI commentary.",
    keyPoints: [
      "document = main .docx",
      "images[] = screenshots (optional but recommended)",
    ],
    takeaway: "Fix structure gaps before iterating on code quality.",
    scene: { id: "practice-upload", data: { taskId: "task_4a" } },
    beats: PRACTICE_UPLOAD_BEATS,
  },
];
