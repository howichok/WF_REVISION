/**
 * Converts deterministic rubric output into the PlanMarkResult shape used by the UI.
 */
import type { PlanMarkCriterion, PlanMarkResult } from "@/lib/esp/plan-marker";
import type { RubricResult } from "@/lib/esp/rubric";

function bandFromRatio(ratio: number): PlanMarkResult["overallBand"] {
  if (ratio >= 0.85) return "distinction";
  if (ratio >= 0.7) return "merit";
  if (ratio >= 0.55) return "pass";
  if (ratio >= 0.35) return "borderline";
  return "not_yet";
}

export function rubricResultToPlanMark(
  r: RubricResult,
  options: { title: string; summaryHint?: string }
): PlanMarkResult {
  const maxScore = Math.max(1, r.max * 3);
  const totalScore = Math.min(maxScore, Math.round((r.score / r.max) * maxScore) || 0);
  const ratio = r.max > 0 ? r.score / r.max : 0;

  const criteria: PlanMarkCriterion[] = [];
  let idx = 0;

  for (const hit of r.hits) {
    criteria.push({
      id: `hit-${idx++}`,
      label: "Strength",
      score: 3,
      maxScore: 3,
      verdict: "strong",
      feedback: hit,
      cells: [],
      modelAnswer: "",
    });
  }

  for (const miss of r.missing) {
    criteria.push({
      id: `miss-${idx++}`,
      label: "Gap",
      score: 0,
      maxScore: 3,
      verdict: "missing",
      feedback: miss,
      cells: [],
      modelAnswer: "Address this point with concrete evidence from your scenario.",
    });
  }

  if (criteria.length === 0) {
    criteria.push({
      id: "empty",
      label: "Submission",
      score: 0,
      maxScore: 3,
      verdict: "missing",
      feedback: "No scoring signals were found. Upload a filled template.",
      cells: [],
      modelAnswer: "",
    });
  }

  const summary =
    options.summaryHint ??
    `${options.title}: ${r.score}/${r.max} checklist items passed. ${r.missing.length ? "See gaps below." : "Nice coverage of the basics."}`;

  return {
    totalScore,
    maxScore,
    overallBand: bandFromRatio(ratio),
    summaryFeedback: summary,
    criteria,
    improvementPriority: r.missing.slice(0, 5),
  };
}
