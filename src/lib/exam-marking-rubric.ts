import { getMarkSchemeConceptsForQuestion } from "@/lib/content";
import { extractCommandWord } from "@/lib/command-words";
import { resolveSharedCurriculumSnapshot } from "@/lib/shared-curriculum";
import type { SharedCurriculumSnapshot } from "@/lib/shared-curriculum";

const MARK_SUMMARY_MAX = 880;
const EXPECTATION_MAX = 620;

/**
 * Server-side rubric text for exam marking (richer than client-truncated payloads).
 */
export function buildServerMarkSchemeSummary(
  questionId: string,
  fallbackExpectation: string,
  snapshot: SharedCurriculumSnapshot | null
): string {
  const concepts = getMarkSchemeConceptsForQuestion(questionId, snapshot);
  if (concepts.length === 0) {
    return fallbackExpectation.replace(/\s+/g, " ").trim().slice(0, MARK_SUMMARY_MAX);
  }

  return concepts
    .slice(0, 6)
    .map((c) => {
      const summary = c.summary.replace(/\s+/g, " ").trim().slice(0, 200);
      return `${c.title}: ${summary}`;
    })
    .join(" || ")
    .slice(0, MARK_SUMMARY_MAX);
}

export function getCanonicalExpectation(
  questionId: string,
  fallback: string,
  snapshot: SharedCurriculumSnapshot | null
): string {
  const question = resolveSharedCurriculumSnapshot(snapshot).questions.find((q) => q.id === questionId);
  const raw = question?.expectation?.trim();
  if (raw) {
    return raw.replace(/\s+/g, " ").slice(0, EXPECTATION_MAX);
  }
  return fallback.replace(/\s+/g, " ").trim().slice(0, EXPECTATION_MAX);
}

export function compactCommandWordForMarking(prompt: string): string {
  const cw = extractCommandWord(prompt);
  if (!cw) {
    return "";
  }
  const hint = cw.guidance.replace(/\s+/g, " ").trim().slice(0, 100);
  return `${cw.id}:${hint}`;
}
