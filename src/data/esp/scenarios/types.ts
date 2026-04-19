import type { EspTask } from "@/data/curriculum";

/** URL segment for each ESP stage (matches ESP_TASK_SLUGS values). */
export type EspStageSlug =
  | "pre-release"
  | "task-1"
  | "task-2"
  | "task-3"
  | "task-4a"
  | "task-4b";

export type BriefSegmentCategory = "aim" | "constraint" | "file" | "risk" | "user" | "neutral";

export interface EspBriefSegment {
  id: string;
  text: string;
  category: BriefSegmentCategory;
}

export interface EspTestCaseRow {
  id: string;
  purpose: string;
  testData: string;
  expected: string;
  /** Hint for learner — actual before fix may differ */
  notes?: string;
}

export interface EspScenarioRole {
  id: string;
  label: string;
  dayRateGbp: number;
}

export interface EspScenario {
  id: string;
  title: string;
  vocationalContext: string;
  sourceNote: string;
  briefSegments: EspBriefSegment[];
  roles: EspScenarioRole[];
  /** Gantt: number of week columns */
  planWeeks: number;
  /** Suggested stage labels for Task 1 bars */
  suggestedStages: string[];
  task2: {
    buggyCode: string;
    defectsHintCount: number;
    testCases: EspTestCaseRow[];
    /** Substrings that should appear in fixed code (normalized check) */
    fixPatterns: string[];
  };
  task3: {
    designPrompt: string;
    csvHeaders: string[];
    csvSampleRows: string[][];
  };
  task4a: {
    starterCode: string;
    csvFilename: string;
    csvContent: string;
    featureHint: string;
  };
  task4b: {
    systemRequirements: string[];
    userRequirements: string[];
  };
}

export const ESP_STAGE_ORDER: EspTask[] = [
  "pre_release",
  "task_1",
  "task_2",
  "task_3",
  "task_4a",
  "task_4b",
];

export const ESP_TASK_TO_SLUG: Record<EspTask, EspStageSlug> = {
  pre_release: "pre-release",
  task_1: "task-1",
  task_2: "task-2",
  task_3: "task-3",
  task_4a: "task-4a",
  task_4b: "task-4b",
};

export const ESP_SLUG_TO_TASK: Record<EspStageSlug, EspTask> = {
  "pre-release": "pre_release",
  "task-1": "task_1",
  "task-2": "task_2",
  "task-3": "task_3",
  "task-4a": "task_4a",
  "task-4b": "task_4b",
};
