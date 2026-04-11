export type RevisionPracticeQuestionKind = "mcq" | "short_written";

/**
 * Maps outcomes to ontology codes in `revision_practice_tags` (global rows).
 */
export function deriveRevisionPracticeTagCodes(options: {
  questionKind: RevisionPracticeQuestionKind;
  correct: boolean;
  verdict?: string | null;
}): string[] {
  if (options.questionKind === "mcq") {
    return options.correct ? ["stable_retrieval"] : ["retrieval_gap"];
  }

  switch (options.verdict) {
    case "strong":
      return ["stable_retrieval"];
    case "mostly-correct":
      return ["minor_gap"];
    case "partial":
      return ["retrieval_gap"];
    case "not-quite":
      return ["misconception"];
    default:
      return options.correct ? ["stable_retrieval"] : ["misconception"];
  }
}
