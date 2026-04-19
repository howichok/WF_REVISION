/**
 * Task 4a AI marking — text-only to Gemini; images described upstream via Vision.
 */
import type { EspScenario } from "@/data/esp/scenarios/types";
import type { PlanMarkResult } from "@/lib/esp/plan-marker";
import type { Task4aParseResult } from "@/lib/esp/task4a-parser";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const MODEL = process.env.GEMINI_ESP_MARK_MODEL?.trim() || "gemini-2.5-flash-lite";

export async function imageToText(base64: string, mimeType: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "(Vision unavailable — set GEMINI_API_KEY)";
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [
          {
            inlineData: { mimeType, data: base64 },
          },
          {
            text: "Describe all visible code, terminal output, tables, and data in this screenshot. Return only factual text content useful for marking — no preamble.",
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
    const payload = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  } catch (e) {
    console.error("[task4a-marker] vision", e);
    return "(Could not read image)";
  }
}

function fallbackMark(scenario: EspScenario, parse: Task4aParseResult): PlanMarkResult {
  const structPenalty = parse.missingSections.length * 2;
  let score = 15 - Math.min(12, structPenalty);
  if (!parse.hasCodeEvidence) score -= 2;
  if (!parse.hasTestOutput) score -= 2;
  if (!parse.hasEvaluation) score -= 2;
  score = Math.max(0, Math.min(15, score));

  return {
    totalScore: score,
    maxScore: 15,
    overallBand: score >= 12 ? "merit" : score >= 8 ? "pass" : "not_yet",
    summaryFeedback: `Deterministic check for ${scenario.title}. Missing sections: ${parse.missingSections.length}. Set GEMINI_API_KEY for full AI feedback.`,
    criteria: [
      {
        id: "feature",
        label: "Feature description",
        score: parse.sections[0] && parse.sections[0].wordCount > 10 ? 3 : 1,
        maxScore: 3,
        verdict: parse.sections[0] && parse.sections[0].wordCount > 10 ? "ok" : "weak",
        feedback: parse.sections[0]?.text.slice(0, 200) || "Add detail under Section 1.",
        cells: [],
        modelAnswer: "Name the user goal, inputs, and expected behaviour for this scenario.",
      },
      {
        id: "code",
        label: "Code quality / evidence",
        score: parse.hasCodeEvidence ? 3 : 0,
        maxScore: 3,
        verdict: parse.hasCodeEvidence ? "ok" : "missing",
        feedback: parse.hasCodeEvidence ? "Code evidence detected." : "Paste code or screenshot in Section 2.",
        cells: [],
        modelAnswer: "Show the key function with clear variable names and CSV handling.",
      },
      {
        id: "test",
        label: "Test evidence",
        score: parse.hasTestOutput ? 3 : 0,
        maxScore: 3,
        verdict: parse.hasTestOutput ? "ok" : "missing",
        feedback: parse.hasTestOutput ? "Test/output cues found." : "Add terminal output or screenshot in Section 3.",
        cells: [],
        modelAnswer: "Show at least one passing test with inputs and actual output.",
      },
      {
        id: "data",
        label: "Data handling",
        score: /csv|row|column|dict|reader/i.test(parse.sections.map((s) => s.text).join("\n")) ? 3 : 1,
        maxScore: 3,
        verdict: "weak",
        feedback: "Ensure Section 4 names the file and sample fields.",
        cells: [],
        modelAnswer: "State which CSV file you used and one example row.",
      },
      {
        id: "eval",
        label: "Self-evaluation",
        score: parse.hasEvaluation ? 3 : 0,
        maxScore: 3,
        verdict: parse.hasEvaluation ? "ok" : "missing",
        feedback: parse.hasEvaluation ? "Evaluation paragraph has substance." : "Expand Section 5 beyond one line.",
        cells: [],
        modelAnswer: "Link the feature back to the client requirement in one concrete sentence.",
      },
    ],
    improvementPriority: parse.missingSections.slice(0, 3),
  };
}

export async function markTask4a(
  scenario: EspScenario,
  parse: Task4aParseResult,
  imageDescriptions: string[]
): Promise<PlanMarkResult> {
  if (!GEMINI_API_KEY) {
    return fallbackMark(scenario, parse);
  }

  const sectionDump = parse.sections
    .map((s) => `## ${s.name}\nWords: ${s.wordCount}\n${s.text}`)
    .join("\n\n");

  const structureNote = `Deterministic structure issues: ${parse.missingSections.join("; ") || "none"}`;
  const imagesNote = imageDescriptions.filter(Boolean).join("\n---\n");

  const prompt = `You are marking T Level DSD Task 4a (development evidence) for scenario "${scenario.title}".
Context: ${scenario.vocationalContext}
Feature hint: ${scenario.task4a.featureHint}

STRUCTURE CHECK (fact — do not contradict): ${structureNote}

STUDENT DOCX TEXT (sections):
${sectionDump}

IMAGE DESCRIPTIONS (from screenshots):
${imagesNote || "(none)"}

Mark using 5 criteria (0-3 marks each, total 0-15):
1. FEATURE_DESCRIPTION — clear feature goal aligned to the brief
2. CODE_QUALITY — readable code / evidence of fix or feature
3. TEST_EVIDENCE — output or tests proving behaviour
4. DATA_HANDLING — correct reference to CSV/data
5. SELF_EVALUATION — links feature to requirement

Respond ONLY with valid JSON:
{
  "totalScore": <0-15>,
  "maxScore": 15,
  "overallBand": "<distinction|merit|pass|borderline|not_yet>",
  "summaryFeedback": "<2-3 sentences>",
  "criteria": [
    {
      "id": "<snake_case>",
      "label": "<short label>",
      "score": <0-3>,
      "maxScore": 3,
      "verdict": "<strong|ok|weak|missing>",
      "feedback": "<specific>",
      "cells": [],
      "modelAnswer": "<one sentence>"
    }
  ],
  "improvementPriority": ["<up to 3 strings>"]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
    const payload = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const responseText = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const cleaned = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as PlanMarkResult;
    return parsed;
  } catch (e) {
    console.error("[task4a-marker]", e);
    return fallbackMark(scenario, parse);
  }
}
