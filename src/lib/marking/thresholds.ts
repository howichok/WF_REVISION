/** Shared ratio thresholds for short-answer marking (practice slots + revision concepts). */
export const STRONG_ANSWER_RATIO = 0.78;
export const MOSTLY_CORRECT_RATIO = 0.55;
/** Below this (but above zero score) answers read as thin / underdeveloped. */
export const THIN_ANSWER_RATIO = 0.4;
/** Minimum token count before detailed feedback is useful. */
export const MIN_FEEDBACK_TOKENS = 4;
/** Token overlap bar for fuzzy multi-token matches (shared with legacy practice-evaluator). */
export const PHRASE_TOKEN_OVERLAP_MIN = 0.72;
/** Similarity when answer is a token subset of the expected phrase. */
export const TOKEN_SUBSET_SIMILARITY = 0.92;
