/**
 * Deterministic marking for uploaded practice files (non–Task 4a).
 */
import type { EspTask } from "@/data/curriculum";
import type { EspScenario } from "@/data/esp/scenarios/types";
import mammoth from "mammoth";
import { rubricResultToPlanMark } from "@/lib/esp/rubric-to-plan-mark";
import {
  scoreTask2Tests,
  scoreTask3Design,
  type DesignBlockState,
  type RubricResult,
  type TestLogRowState,
} from "@/lib/esp/rubric";
import type { PlanMarkResult } from "@/lib/esp/plan-marker";

export async function extractTextFromFile(buffer: Buffer, name: string): Promise<string> {
  const lower = name.toLowerCase();
  if (lower.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (lower.endsWith(".py") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return buffer.toString("utf-8");
  }
  return "";
}

export function parseTestRowsFromMarkdownTable(text: string): TestLogRowState[] {
  const rows: TestLogRowState[] = [];
  for (const line of text.split("\n")) {
    if (!line.includes("|")) continue;
    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cols.length < 4) continue;
    if (/^[-:]+$/.test(cols[0] ?? "")) continue;
    if (/purpose/i.test(cols[0] ?? "") && /input/i.test(cols[1] ?? "")) continue;
    rows.push({
      purpose: cols[0] ?? "",
      input: cols[1] ?? "",
      expected: cols[2] ?? "",
      actual: cols[3] ?? "",
    });
  }
  return rows.slice(0, 12);
}

function extractPythonFromText(text: string): string {
  const fence = text.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) return fence[1].trim();
  return text;
}

function scorePreReleaseText(scenario: EspScenario, text: string): RubricResult {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const expected = scenario.briefSegments.filter((s) => s.category !== "neutral");
  const max = Math.max(1, expected.length);

  for (const seg of expected) {
    const token = seg.text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .find((w) => w.length > 4);
    if (token && lower.includes(token)) {
      score += 1;
      hits.push(`Theme "${seg.category}" reflected in your notes`);
    } else {
      missing.push(`Strengthen ${seg.category}: echo a fact from the brief (e.g. “${seg.text.slice(0, 52)}…”).`);
    }
  }

  if (text.trim().length < 120) {
    missing.push("Add more detail — aim for at least two short paragraphs across the sections.");
  } else {
    hits.push("Submission has substantive length");
  }

  return { score: Math.min(max, score), max, hits, missing };
}

function inferDesignBlocksFromText(scenario: EspScenario, text: string): DesignBlockState[] {
  const lower = text.toLowerCase();
  const blocks: DesignBlockState[] = [];
  let i = 0;
  if (/input|csv|read|import|load/i.test(lower)) {
    blocks.push({ id: `b${i++}`, kind: "Input", label: "Data in" });
  }
  if (/valid|check|if |try|error/i.test(lower)) {
    blocks.push({ id: `b${i++}`, kind: "Validate", label: "Validation" });
  }
  blocks.push({ id: `b${i++}`, kind: "Process", label: "Core processing" });
  if (/output|print|return|report|write/i.test(lower)) {
    blocks.push({ id: `b${i++}`, kind: "Output", label: "Results" });
  }
  if (scenario.task3.csvHeaders.some((h) => lower.includes(h.toLowerCase()))) {
    blocks.push({ id: `b${i++}`, kind: "Process", label: "CSV fields" });
  }
  return blocks;
}

function scoreTask4bText(scenario: EspScenario, text: string): RubricResult {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 6;

  const sysHits = scenario.task4b.systemRequirements.filter((r) =>
    lower.includes(r.slice(0, Math.min(12, r.length)).toLowerCase())
  ).length;
  if (sysHits >= 1) {
    score += 2;
    hits.push("Touches system requirements");
  } else missing.push("Quote or reference at least one system requirement with evidence");

  const usrHits = scenario.task4b.userRequirements.filter((r) =>
    lower.includes(r.slice(0, Math.min(12, r.length)).toLowerCase())
  ).length;
  if (usrHits >= 1) {
    score += 2;
    hits.push("Touches user requirements");
  } else missing.push("Reference a user-facing requirement explicitly");

  if (/limit|constraint|weak|improve|future|next/i.test(lower)) {
    score += 1;
    hits.push("Discusses limitations or improvements");
  } else missing.push("Add a limitation and a justified improvement");

  if (text.length > 250) {
    score += 1;
    hits.push("Evaluation has sufficient length");
  } else missing.push("Expand each section with evidence-led sentences");

  return { score: Math.min(score, max), max, hits, missing };
}

export async function markPracticeUpload(
  task: EspTask,
  scenario: EspScenario,
  files: { name: string; buffer: Buffer }[]
): Promise<PlanMarkResult> {
  const combinedText = (
    await Promise.all(files.map((f) => extractTextFromFile(f.buffer, f.name)))
  ).join("\n\n");

  const pyFile = files.find((f) => f.name.toLowerCase().endsWith(".py"));
  const codeFromPy = pyFile ? pyFile.buffer.toString("utf-8") : extractPythonFromText(combinedText);

  let rubric: RubricResult;

  switch (task) {
    case "pre_release":
      rubric = scorePreReleaseText(scenario, combinedText);
      return rubricResultToPlanMark(rubric, {
        title: "Pre-release notes",
        summaryHint: `Brief triage for ${scenario.title}: ${rubric.score}/${rubric.max} themes detected.`,
      });
    case "task_2": {
      const rows = parseTestRowsFromMarkdownTable(combinedText);
      rubric = scoreTask2Tests(scenario, codeFromPy, rows);
      return rubricResultToPlanMark(rubric, {
        title: "Task 2 defect fix",
        summaryHint: `Code + test log check for ${scenario.title}.`,
      });
    }
    case "task_3": {
      const blocks = inferDesignBlocksFromText(scenario, combinedText);
      rubric = scoreTask3Design(scenario, blocks, combinedText);
      return rubricResultToPlanMark(rubric, {
        title: "Task 3 design",
        summaryHint: `IPO / design checklist for ${scenario.title}.`,
      });
    }
    case "task_4b":
      rubric = scoreTask4bText(scenario, combinedText);
      return rubricResultToPlanMark(rubric, {
        title: "Task 4b evaluation",
        summaryHint: `Reflection checklist for ${scenario.title}.`,
      });
    default:
      return rubricResultToPlanMark(
        { score: 0, max: 1, hits: [], missing: ["Unsupported task"] },
        { title: "Upload", summaryHint: "Unsupported task type." }
      );
  }
}
