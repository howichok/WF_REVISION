/**
 * AI marking for Task 1 (Project Plan).
 * Sends the student's Gantt rows + rationale to Gemini and returns
 * structured feedback with per-criterion scores, cell annotations,
 * and a model answer for each weak criterion.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const MODEL = process.env.GEMINI_ESP_MARK_MODEL?.trim() || "gemini-2.5-flash-lite";

export interface PlanMarkCriterion {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  verdict: "strong" | "ok" | "weak" | "missing";
  feedback: string;
  /** Cell references to annotate in the spreadsheet, e.g. ["A3", "B5"] */
  cells: string[];
  modelAnswer: string;
}

export interface PlanMarkResult {
  totalScore: number;
  maxScore: number;
  overallBand: "distinction" | "merit" | "pass" | "borderline" | "not_yet";
  summaryFeedback: string;
  criteria: PlanMarkCriterion[];
  improvementPriority: string[];
}

export function isMarkingConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

interface GanttRow {
  stage: string;
  owner: string;
  startWeek: number;
  endWeek: number;
  notes?: string;
}

interface RationaleMap {
  [point: string]: string;
}

export async function markPlan(
  scenarioTitle: string,
  scenarioContext: string,
  planWeeks: number,
  rows: GanttRow[],
  rationale: RationaleMap
): Promise<PlanMarkResult> {
  if (!GEMINI_API_KEY) {
    return fallbackMark(rows, rationale, scenarioTitle);
  }

  const ganttText = rows
    .map(
      (r, i) =>
        `Row ${i + 1}: Stage="${r.stage}" | Owner="${r.owner}" | Start=W${r.startWeek} | End=W${r.endWeek} | Notes="${r.notes ?? ""}"`
    )
    .join("\n");

  const rationaleText = Object.entries(rationale)
    .map(([k, v]) => `${k}: ${v || "(not answered)"}`)
    .join("\n");

  const prompt = `
You are an expert T Level Digital Software Development examiner marking a Task 1 Project Plan.

Scenario: ${scenarioTitle}
Context: ${scenarioContext}
Project duration: ${planWeeks} weeks

Student's Gantt / schedule rows:
${ganttText || "(no rows entered)"}

Student's rationale:
${rationaleText || "(no rationale entered)"}

Mark this submission using the following 6 criteria (each worth 0-3 marks):

1. SEQUENCING (max 3): Logical stage order, dependencies visible, analysis before build, testing before handover.
2. STAFF_ALLOCATION (max 3): Roles match stage requirements, named roles, no stage without an owner.
3. TESTING_VISIBILITY (max 3): Testing is explicitly staged before handover, regression time visible, multiple test types mentioned.
4. RATIONALE_DEPTH (max 3): Justifies order, references the specific scenario context, mentions dependencies, costs, risks.
5. RISK_AND_COST (max 3): Identifies specific risks, has cost estimate, cost linked to roles/effort.
6. COVERAGE (max 3): All major project phases covered (analysis, design, build, test, deployment/handover).

For each criterion, also list the specific row numbers or stage names that have issues (for cell annotations).
Also write a 1-sentence model answer showing what a strong response would look like for that criterion.

Respond ONLY with valid JSON matching this schema exactly:
{
  "totalScore": <number 0-18>,
  "maxScore": 18,
  "overallBand": "<distinction|merit|pass|borderline|not_yet>",
  "summaryFeedback": "<2-3 sentence overall comment>",
  "criteria": [
    {
      "id": "<id>",
      "label": "<human label>",
      "score": <0-3>,
      "maxScore": 3,
      "verdict": "<strong|ok|weak|missing>",
      "feedback": "<1-2 sentence specific feedback>",
      "cells": ["<row references like Row 2, Row 5>"],
      "modelAnswer": "<1 sentence showing a strong answer>"
    }
  ],
  "improvementPriority": ["<top 3 things to improve, ordered by impact>"]
}
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  let responseText = "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const payload = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    responseText = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  } catch (e) {
    console.error("[esp/plan-marker] Gemini request failed", e);
    return fallbackMark(rows, rationale, scenarioTitle);
  }

  try {
    // Strip any markdown fences
    const cleaned = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as PlanMarkResult;
    return parsed;
  } catch {
    console.error("[esp/plan-marker] JSON parse failed, raw:", responseText.slice(0, 200));
    return fallbackMark(rows, rationale, scenarioTitle);
  }
}

/** Deterministic fallback when Gemini is unavailable — uses the existing rubric logic. */
function fallbackMark(rows: GanttRow[], rationale: RationaleMap, scenarioTitle: string): PlanMarkResult {
  const hasStages = rows.length >= 4;
  const hasOwners = rows.every((r) => r.owner.trim().length > 0);
  const hasTesting = rows.some((r) => /test|qa|regression/i.test(r.stage + " " + r.notes));
  const hasRationale = Object.values(rationale).some((v) => v.trim().length > 20);
  const hasRisk = Object.entries(rationale).some(([k, v]) => /risk|cost|constraint/i.test(k + v));
  const hasCoverage = rows.some((r) => /deploy|handover|launch/i.test(r.stage));

  const scores = [
    hasStages ? 2 : 1,
    hasOwners ? 2 : 1,
    hasTesting ? 2 : 0,
    hasRationale ? 2 : 0,
    hasRisk ? 2 : 0,
    hasCoverage ? 2 : 1,
  ];
  const total = scores.reduce((a, b) => a + b, 0);

  return {
    totalScore: total,
    maxScore: 18,
    overallBand: total >= 15 ? "distinction" : total >= 12 ? "merit" : total >= 9 ? "pass" : total >= 6 ? "borderline" : "not_yet",
    summaryFeedback: `Your plan for ${scenarioTitle} scored ${total}/18 using deterministic rubric (AI unavailable). Connect GEMINI_API_KEY for detailed feedback.`,
    criteria: [
      { id: "sequencing", label: "Sequencing", score: scores[0]!, maxScore: 3, verdict: scores[0]! >= 2 ? "ok" : "weak", feedback: hasStages ? "Plan has multiple stages." : "Add more stages (aim for 5+).", cells: [], modelAnswer: "Analysis → Design → Build → Integration test → Regression → Deployment, with arrows showing dependencies." },
      { id: "staff_allocation", label: "Staff allocation", score: scores[1]!, maxScore: 3, verdict: scores[1]! >= 2 ? "ok" : "weak", feedback: hasOwners ? "All stages have owners." : "Assign a named role to every stage.", cells: [], modelAnswer: "Each bar names one role matched to its skills (e.g. DBA for database stages, Tester for UAT)." },
      { id: "testing_visibility", label: "Testing visibility", score: scores[2]!, maxScore: 3, verdict: hasTesting ? "ok" : "missing", feedback: hasTesting ? "Testing stage visible." : "Add an explicit testing stage before handover.", cells: [], modelAnswer: "Integration test (W5), regression after fixes (W6), user acceptance before deployment." },
      { id: "rationale_depth", label: "Rationale depth", score: scores[3]!, maxScore: 3, verdict: hasRationale ? "ok" : "missing", feedback: hasRationale ? "Rationale started." : "Write why each stage is ordered as it is.", cells: [], modelAnswer: "Analysis must precede design because requirements determine the data schema; testing before handover protects the client from defects." },
      { id: "risk_and_cost", label: "Risk and cost", score: scores[4]!, maxScore: 3, verdict: hasRisk ? "ok" : "missing", feedback: hasRisk ? "Risk/cost addressed." : "Add specific risks and cost estimates.", cells: [], modelAnswer: "Risk: tester unavailable in week 4 — mitigated by earlier unit testing. Cost: £3,800 based on 10 dev days at £380/day." },
      { id: "coverage", label: "Coverage", score: scores[5]!, maxScore: 3, verdict: hasCoverage ? "ok" : "weak", feedback: hasCoverage ? "Good coverage." : "Missing deployment/handover stage.", cells: [], modelAnswer: "Schedule includes analysis, design, database, UI build, testing, deployment preparation, and staff handover." },
    ],
    improvementPriority: [
      !hasTesting ? "Add an explicit testing stage before handover" : "Split testing into unit test + regression",
      !hasRationale ? "Write rationale for each section" : "Link rationale to client's specific context",
      !hasRisk ? "Add cost estimate and at least two risks with mitigations" : "Quantify cost per role",
    ].slice(0, 3),
  };
}
