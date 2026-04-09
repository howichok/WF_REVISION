/**
 * Exam Questions marking is AI-first when GEMINI_API_KEY is set.
 * Set GEMINI_EXAM_MARK_POLICY=local (or off) only to force the fast local checker — e.g. dev or zero API cost.
 */
export type GeminiExamMarkPolicy = "ai" | "local";

export function parseGeminiExamMarkPolicy(): GeminiExamMarkPolicy {
  const raw = process.env.GEMINI_EXAM_MARK_POLICY?.trim().toLowerCase();
  if (raw === "local" || raw === "off" || raw === "none") {
    return "local";
  }
  return "ai";
}
