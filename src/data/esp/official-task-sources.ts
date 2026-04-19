/**
 * Pearson / NCFE-style ESP materials bundled in the repo under
 * `sources/myexperience/Task/`. Used for hub copy and secure download links.
 */
export type EspBoardTaskGroup = "overview" | "task-1" | "task-2" | "task-3" | "task-4a" | "task-4b";

export interface EspSourceAsset {
  /** Stable id for ?id= in /api/esp/source-asset */
  id: string;
  /** Path segments under `sources/myexperience/Task/` */
  relativePath: string;
  /** Short label for UI */
  title: string;
  group: EspBoardTaskGroup;
  /** One line — what this document is */
  note: string;
}

/** Order matches typical ESP flow; overview = cross-cutting PDFs if any */
export const ESP_OFFICIAL_SOURCE_ASSETS: EspSourceAsset[] = [
  {
    id: "task1-nov-2021-pdf",
    relativePath: "Task 1/Core Employer Set Project - Task1 - November 2021.pdf",
    title: "Task 1 — November 2021 (PDF)",
    group: "task-1",
    note: "Official task paper for the planning / Gantt stage.",
  },
  {
    id: "task2-autumn-24-zip",
    relativePath: "Task 2/ESP Autumn 24 Task 2.zip",
    title: "Task 2 — Autumn 2024 (ZIP)",
    group: "task-2",
    note: "Defect-fix pack (brief + starter files).",
  },
  {
    id: "task2-summer-24-zip",
    relativePath: "Task 2/ESP Summer 24 Task 2.zip",
    title: "Task 2 — Summer 2024 (ZIP)",
    group: "task-2",
    note: "Alternative series — defect-fix pack.",
  },
  {
    id: "task3-autumn-24-zip",
    relativePath: "Task 3/ESP Autumn 24 Task 3.zip",
    title: "Task 3 — Autumn 2024 (ZIP)",
    group: "task-3",
    note: "Design / IPO task materials.",
  },
  {
    id: "task3-2022-zip",
    relativePath: "Task 3/ESP Task 3 2022.zip",
    title: "Task 3 — 2022 (ZIP)",
    group: "task-3",
    note: "Earlier series — design task.",
  },
  {
    id: "task4a-autumn-24-zip",
    relativePath: "Task 4a/ESP Autumn 24 Task 4a.zip",
    title: "Task 4a — Autumn 2024 (ZIP)",
    group: "task-4a",
    note: "Development / evidence task pack.",
  },
  {
    id: "task4a-nov-2023-zip",
    relativePath: "Task 4a/T Level Core Digital ESP 19538 TASK 4A Nov-2023.zip",
    title: "Task 4a — Nov 2023 (ZIP)",
    group: "task-4a",
    note: "Pearson 19538 series — development stage.",
  },
  {
    id: "task4b-nov-2023-pdf",
    relativePath: "4b/W76546 T Level Core Digital ESP 19538 ESP TASK 4B AB Nov-2023.pdf",
    title: "Task 4b — Nov 2023 (PDF)",
    group: "task-4b",
    note: "Evaluation / reflection task paper.",
  },
  {
    id: "task4b-nov-2024-pdf",
    relativePath: "4b/t-level-core-digital-19538-employer-set-project-task-4b-november-2024 2.pdf",
    title: "Task 4b — November 2024 (PDF)",
    group: "task-4b",
    note: "Later series — evaluation task.",
  },
];

const BY_ID: Record<string, EspSourceAsset> = Object.fromEntries(
  ESP_OFFICIAL_SOURCE_ASSETS.map((a) => [a.id, a])
);

export function getEspSourceAssetById(id: string): EspSourceAsset | undefined {
  return BY_ID[id];
}

export const ESP_SOURCE_TASK_ROOT = "sources/myexperience/Task";
