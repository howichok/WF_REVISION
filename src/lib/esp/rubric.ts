import type { EspTask } from "@/data/curriculum";
import type { EspScenario } from "@/data/esp/scenarios/types";

export interface RubricResult {
  score: number;
  max: number;
  hits: string[];
  missing: string[];
}

export type BriefTag = "aim" | "constraint" | "file" | "risk" | "user" | "neutral";

/** Triage: user tagged segments into buckets matching brief categories */
export function scoreBriefTriage(
  scenario: EspScenario,
  tagged: Record<string, BriefTag | undefined>
): RubricResult {
  const expected = scenario.briefSegments.filter((s) => s.category !== "neutral");
  let score = 0;
  const hits: string[] = [];
  const missing: string[] = [];

  for (const seg of expected) {
    const tag = tagged[seg.id];
    if (tag && tag === seg.category) {
      score += 1;
      hits.push(`“${seg.text.slice(0, 48)}…” → ${seg.category}`);
    } else {
      missing.push(`Tag “${seg.text.slice(0, 40)}…” as ${seg.category}`);
    }
  }

  return { score, max: expected.length, hits, missing };
}

export interface PlanBarState {
  stage: string;
  startWeek: number;
  endWeek: number;
  roleId: string;
}

export interface CostLineState {
  label: string;
  days: number;
  roleId: string;
}

export function scoreTask1Plan(
  scenario: EspScenario,
  bars: PlanBarState[],
  rationale: string,
  costLines: CostLineState[]
): RubricResult {
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 8;

  const stages = new Set(bars.map((b) => b.stage.toLowerCase().trim()));
  const suggestedHits = scenario.suggestedStages.filter((s) =>
    [...stages].some((st) => st.includes(s.slice(0, 6).toLowerCase()) || s.toLowerCase().includes(st.slice(0, 6)))
  );
  if (bars.length >= 4) {
    score += 1;
    hits.push("At least four plan bars");
  } else missing.push("Add more stages (aim for 4+ bars)");

  if (suggestedHits.length >= 2) {
    score += 1;
    hits.push("Stages align with suggested phases");
  } else missing.push("Name stages similar to analysis → design → build → test → handover");

  const hasDeps = bars.some((b) => b.endWeek > b.startWeek);
  if (hasDeps) {
    score += 1;
    hits.push("Bars span at least one week");
  } else missing.push("Stretch bars across weeks to show duration");

  const rolesOk = bars.every((b) => scenario.roles.some((r) => r.id === b.roleId));
  if (rolesOk && bars.length) {
    score += 1;
    hits.push("Each bar has a team role");
  } else missing.push("Assign a role from the scenario to each bar");

  if (rationale.trim().length > 80) {
    score += 1;
    hits.push("Rationale paragraph started");
  } else missing.push("Write rationale: why this order, risks, testing");

  const rLow = rationale.toLowerCase();
  if (/(test|regression|qa|evidence)/i.test(rationale)) {
    score += 1;
    hits.push("Rationale mentions testing");
  } else missing.push("Mention testing or regression in rationale");

  if (/(risk|constraint|dependency)/i.test(rationale)) {
    score += 1;
    hits.push("Rationale mentions risks or dependencies");
  } else missing.push("Mention risks or dependencies");

  if (costLines.length) {
    score += 1;
    hits.push("Cost lines entered");
  } else missing.push("Add at least one cost line (days × role)");

  const costMath = costLines.some((c) => c.days > 0 && scenario.roles.some((r) => r.id === c.roleId));
  if (costMath) {
    score += 1;
    hits.push("Cost uses scenario roles and days");
  } else missing.push("Enter days and pick a role for cost estimate");

  return { score, max, hits, missing };
}

export interface TestLogRowState {
  purpose: string;
  input: string;
  expected: string;
  actual: string;
}

export function scoreTask2Tests(scenario: EspScenario, code: string, rows: TestLogRowState[]): RubricResult {
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 6;

  const lower = code.toLowerCase();
  let fixHits = 0;
  for (const p of scenario.task2.fixPatterns) {
    if (lower.includes(p.toLowerCase())) {
      fixHits += 1;
    }
  }
  if (fixHits >= Math.min(2, scenario.task2.fixPatterns.length)) {
    score += 2;
    hits.push("Code shows expected fix patterns");
  } else {
    missing.push("Fix syntax/name bugs — check use of == , correct names, file close");
  }

  const filled = rows.filter((r) => r.purpose.trim() && r.input.trim() && r.expected.trim() && r.actual.trim());
  if (filled.length >= 2) {
    score += 2;
    hits.push("Test log has multiple complete rows");
  } else missing.push("Complete at least two test rows (purpose, input, expected, actual)");

  if (filled.some((r) => /invalid|error|boundary|edge/i.test(r.purpose + r.input))) {
    score += 1;
    hits.push("Includes boundary or erroneous case");
  } else missing.push("Add one boundary or erroneous test");

  if (rows.length >= scenario.task2.testCases.length) {
    score += 1;
    hits.push("Test rows cover scenario cases");
  } else missing.push("Mirror suggested test purposes from the scenario");

  return { score, max, hits, missing };
}

export interface DesignBlockState {
  id: string;
  kind: string;
  label: string;
}

export function scoreTask3Design(scenario: EspScenario, blocks: DesignBlockState[], pseudocode: string): RubricResult {
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 6;

  const kinds = new Set(blocks.map((b) => b.kind));
  for (const need of ["Input", "Validate", "Output"]) {
    if (kinds.has(need)) {
      score += 1;
      hits.push(`${need} block on canvas`);
    } else missing.push(`Add a ${need} block`);
  }

  if (blocks.length >= 5) {
    score += 1;
    hits.push("Five or more blocks — good decomposition");
  } else missing.push("Add more blocks for validation, processing, output");

  if (pseudocode.trim().length > 120) {
    score += 1;
    hits.push("Pseudocode section has detail");
  } else missing.push("Expand pseudocode with steps and branches");

  if (/if|while|for|else/i.test(pseudocode)) {
    score += 1;
    hits.push("Pseudocode uses selection or iteration");
  } else missing.push("Add if/while/for for control flow");

  if (pseudocode.toLowerCase().includes("csv") || pseudocode.toLowerCase().includes("read")) {
    score += 1;
    hits.push("Pseudocode references data read/import");
  } else missing.push("Mention reading or validating the CSV");

  return { score, max, hits, missing };
}

export function scoreTask4aCode(scenario: EspScenario, code: string, lastOutput: string): RubricResult {
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 5;

  if (code.includes("def ") && code.includes("menu")) {
    score += 1;
    hits.push("Structured functions / menu");
  } else missing.push("Keep modular functions and menu pattern");

  if (/try|if.*exist|strip\(\)/i.test(code)) {
    score += 1;
    hits.push("Some validation or guard");
  } else missing.push("Add file-exists or input checks");

  if (lastOutput.length > 20) {
    score += 1;
    hits.push("Captured run output");
  } else missing.push("Run the script and capture output as evidence");

  if (code.toLowerCase().includes("csv") || code.includes("DictReader")) {
    score += 1;
    hits.push("CSV handling present");
  } else missing.push("Use csv module or DictReader for data");

  if (scenario.id === "car-sales") {
    if (/new|used|condition/i.test(code)) {
      score += 1;
      hits.push("Feature hints at new vs used comparison");
    } else {
      missing.push("Implement new vs used totals (condition column)");
    }
  } else if (/print|def |input\(/i.test(code)) {
    score += 1;
    hits.push("Interactive or printable output");
  } else {
    missing.push("Extend starter toward the scenario feature");
  }

  return { score, max, hits, missing };
}

export interface EvalRequirementState {
  id: number;
  status: "met" | "partial" | "not_met";
  evidence: string;
}

export interface ImprovementState {
  what: string;
  why: string;
  impact: string;
}

export function scoreTask4bEval(
  system: EvalRequirementState[],
  user: EvalRequirementState[],
  improvements: ImprovementState[]
): RubricResult {
  const hits: string[] = [];
  const missing: string[] = [];
  let score = 0;
  const max = 6;

  const sysDone = system.filter((s) => s.status !== "not_met" && s.evidence.trim().length > 15).length;
  if (sysDone >= 1) {
    score += 2;
    hits.push("System requirements evidenced");
  } else missing.push("Set status and evidence for system requirements");

  const usrDone = user.filter((s) => s.status !== "not_met" && s.evidence.trim().length > 15).length;
  if (usrDone >= 1) {
    score += 2;
    hits.push("User requirements evidenced");
  } else missing.push("Set status and evidence for user requirements");

  const imps = improvements.filter((i) => i.what.trim() && i.why.trim() && i.impact.trim());
  if (imps.length >= 2) {
    score += 2;
    hits.push("Two+ justified improvements");
  } else missing.push("Add improvements with what / why / impact");

  return { score, max, hits, missing };
}

export function rubricForTask(
  task: EspTask,
  scenario: EspScenario,
  payload: unknown
): RubricResult {
  switch (task) {
    case "pre_release":
      return scoreBriefTriage(scenario, payload as Record<string, BriefTag | undefined>);
    case "task_1":
      return scoreTask1Plan(
        scenario,
        (payload as { bars: PlanBarState[]; rationale: string; costLines: CostLineState[] }).bars,
        (payload as { rationale: string }).rationale,
        (payload as { costLines: CostLineState[] }).costLines
      );
    case "task_2":
      return scoreTask2Tests(
        scenario,
        (payload as { code: string; rows: TestLogRowState[] }).code,
        (payload as { rows: TestLogRowState[] }).rows
      );
    case "task_3":
      return scoreTask3Design(
        scenario,
        (payload as { blocks: DesignBlockState[]; pseudocode: string }).blocks,
        (payload as { pseudocode: string }).pseudocode
      );
    case "task_4a":
      return scoreTask4aCode(scenario, (payload as { code: string; lastOutput: string }).code, (payload as { lastOutput: string }).lastOutput);
    case "task_4b":
      return scoreTask4bEval(
        (payload as { system: EvalRequirementState[]; user: EvalRequirementState[]; improvements: ImprovementState[] }).system,
        (payload as { user: EvalRequirementState[] }).user,
        (payload as { improvements: ImprovementState[] }).improvements
      );
    default:
      return { score: 0, max: 0, hits: [], missing: [] };
  }
}
