import type { ExamConditionsQuestion } from "@/lib/exam-conditions";

/** When false, every answered question is sent to Gemini (highest cost). */
export function isExamGeminiAmbiguityGateEnabled() {
  const raw = process.env.GEMINI_EXAM_AMBIGUITY_GATE?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") {
    return false;
  }
  return true;
}

type LocalEval = {
  score: number;
  maxScore: number;
  scorePercent: number;
  evaluation: { confidence: number; verdict: string };
};

function questionTariffMarks(question: ExamConditionsQuestion) {
  return Math.max(1, question.marks);
}

/**
 * Cheap local signal: only borderline / long / high-mark questions go to the model.
 * Obvious full credit or zero from the keyword-style checker skips Gemini for that item.
 */
export function examAnswerNeedsGeminiMark(
  question: ExamConditionsQuestion,
  answer: string,
  local: LocalEval
): boolean {
  const trimmed = answer.trim();
  if (!trimmed) {
    return false;
  }

  const { scorePercent, evaluation } = local;
  const conf = evaluation.confidence;
  const tariff = questionTariffMarks(question);

  /** Semantic depth / heavy tariff — check before “clear pass” shortcuts. */
  if (trimmed.length > 520) {
    return true;
  }
  if (tariff >= 7) {
    return true;
  }

  if (scorePercent <= 8) {
    return false;
  }
  if (scorePercent >= 92 && conf >= 78) {
    return false;
  }

  if (scorePercent > 18 && scorePercent < 85) {
    return true;
  }
  if (conf >= 32 && conf <= 82) {
    return true;
  }

  return false;
}
