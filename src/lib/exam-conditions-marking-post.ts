import type {
  ExamConditionsQuestion,
  ExamGeminiItemLevel,
  GeminiExamMarkItem,
  GeminiExamMarkResponse,
} from "@/lib/exam-conditions";

const ITEM_LEVELS: ExamGeminiItemLevel[] = ["none", "basic", "clear", "detailed"];

export type LocalExamQuestionEvaluator = (question: ExamConditionsQuestion, answer: string) => {
  score: number;
  evaluation: {
    matchedSlots: string[];
    missingSlots: string[];
    feedback: string;
  };
};

export function parseItemLevel(raw: unknown): ExamGeminiItemLevel {
  const value = String(raw ?? "none").toLowerCase().trim();
  return ITEM_LEVELS.includes(value as ExamGeminiItemLevel) ? (value as ExamGeminiItemLevel) : "none";
}

export function bandIndexFromPercent(percent: number): number {
  if (percent >= 75) return 3;
  if (percent >= 55) return 2;
  if (percent >= 35) return 1;
  return 0;
}

export function bandLabelFromIndex(index: number): string {
  const labels = ["Below", "Pass", "Merit", "Strong"];
  return labels[Math.max(0, Math.min(3, index))] ?? "Pass";
}

export function modelBandIndex(band: string): number {
  const text = band.toLowerCase().trim();
  if (text.includes("strong")) return 3;
  if (text.includes("merit")) return 2;
  if (text.includes("pass")) return 1;
  if (text.includes("below") || text.includes("build")) return 0;
  return -1;
}

export function reconcileOverallBand(
  modelBand: string,
  scorePercent: number,
  maxStepDrift = 1
): { displayBand: string; overridden: boolean } {
  const modelIndex = modelBandIndex(modelBand);
  const percentIndex = bandIndexFromPercent(scorePercent);

  if (modelIndex < 0) {
    return { displayBand: bandLabelFromIndex(percentIndex), overridden: false };
  }

  if (Math.abs(modelIndex - percentIndex) > maxStepDrift) {
    return {
      displayBand: `${bandLabelFromIndex(percentIndex)} (aligned to marks)`,
      overridden: true,
    };
  }

  return {
    displayBand: modelBand.replace(/\s+/g, " ").trim().slice(0, 56),
    overridden: false,
  };
}

export function markDriftThreshold(maxScore: number): number {
  return Math.max(1, Math.floor(maxScore * 0.35));
}

export function geminiVsLocalLowConfidence(
  geminiMark: number,
  localScore: number,
  maxScore: number
): boolean {
  return Math.abs(geminiMark - localScore) > markDriftThreshold(maxScore);
}

/**
 * Ensures exactly one Gemini row per session question; missing ids are filled from the local evaluator.
 */
export function ensureCompleteGeminiItems(
  gemini: GeminiExamMarkResponse,
  questions: ExamConditionsQuestion[],
  answers: Record<string, string>,
  evaluateLocal: LocalExamQuestionEvaluator
): GeminiExamMarkItem[] {
  const byId = new Map<string, GeminiExamMarkItem>();
  for (const item of gemini.items) {
    if (item.id && !byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return questions.map((question) => {
    const existing = byId.get(question.id);
    if (existing) {
      return existing;
    }

    const local = evaluateLocal(question, answers[question.id] ?? "");
    return {
      id: question.id,
      m: local.score,
      hit: local.evaluation.matchedSlots.slice(0, 4),
      miss: local.evaluation.missingSlots.slice(0, 4),
      fb: local.evaluation.feedback.slice(0, 400),
      why: "No model row for this question; filled using the fast local marker.",
      evidence: [],
      level: "none",
    };
  });
}
