import type { EspGenericLessonStep } from "@/data/esp/steps/types";
import { IPO_FLOW_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task3/ipo-flow-scene";
import { DESIGN_ARTEFACTS_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task3/design-artefacts-scene";
import { DESIGN_COMPARE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task3/design-compare-scene";
import { PRACTICE_UPLOAD_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/practice-upload-scene";

export const TASK3_STEPS: EspGenericLessonStep[] = [
  {
    id: "ipo",
    number: 1,
    label: "IPO first",
    emoji: "🧠",
    duration: "3 min",
    durationMs: 150_000,
    headline: "Design is not code — it is a provable plan.",
    lead: "Task 3 wants Inputs → Validation → Processing → Outputs before a single line of production code.",
    keyPoints: [
      "Inputs: name the files, fields, and formats.",
      "Validation: say what you reject and why.",
      "Outputs: describe artefacts the client can see.",
    ],
    takeaway: "Flowcharts or structured pseudocode beat paragraphs of Python.",
    scene: { id: "task3-ipo-flow" },
    beats: IPO_FLOW_BEATS,
  },
  {
    id: "data",
    number: 2,
    label: "Design portfolio",
    emoji: "🗂️",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Every artefact has a named slot.",
    lead: "Markers open a design pack expecting a data dictionary, a flowchart, and a wireframe. Miss one and the portfolio looks thin.",
    keyPoints: [
      "Data dictionary: fields, types, validation.",
      "Flowchart: process path from input to output.",
      "Wireframe: what the user sees on screen.",
    ],
    takeaway: "If a slot is empty, a marker cannot give you that mark.",
    scene: { id: "task3-design-artefacts" },
    beats: DESIGN_ARTEFACTS_BEATS,
  },
  {
    id: "trace",
    number: 3,
    label: "Trace a happy path",
    emoji: "🔁",
    duration: "2 min",
    durationMs: 120_000,
    headline: "Walk one record through the system.",
    lead: "Pick a sample row and narrate how it moves through validation and processing to an output.",
    keyPoints: [
      "Use plain language or pseudocode — not library calls.",
      "Show branching — what happens on failure?",
      "End with the user-visible result.",
    ],
    takeaway: "A single traced story proves you understand the whole pipeline.",
    scene: { id: "task3-design-compare" },
    beats: DESIGN_COMPARE_BEATS,
  },
  {
    id: "practice",
    number: 4,
    label: "Your turn",
    emoji: "🎯",
    duration: "Your time",
    durationMs: 60_000,
    headline: "Complete the IPO template in Word and upload it.",
    lead: "Markers want structured evidence — headings matter more than fonts.",
    keyPoints: [
      "Download scenario-specific design template.",
      "Fill Inputs / Process / Outputs sections.",
      "Upload your .docx for checklist feedback.",
    ],
    takeaway: "Keep diagrams simple — clarity beats decoration.",
    scene: { id: "practice-upload", data: { taskId: "task_3" } },
    beats: PRACTICE_UPLOAD_BEATS,
  },
];
