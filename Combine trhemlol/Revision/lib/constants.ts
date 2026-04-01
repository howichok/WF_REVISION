export const EXAM_DATES = {
  paper1: new Date("2026-06-02T09:00:00.000Z"),
  paper2: new Date("2026-06-09T09:00:00.000Z"),
};

export const EXAM_DURATION_MINUTES = 135;

export const WEAK_BONUS = 20;

export const EXAM_PACER_MILESTONES_MINUTES = [30, 60, 90, 120];

export const EXAM_PACER_LAST_MINUTES_WARNING = 15;

/** Rubric matching uses substring + Levenshtein similarity (see lib/evaluation.ts). Prefer richer keywords/synonyms in data/examQuestions.json before lowering this further. */
export const RUBRIC_FUZZY_THRESHOLD = 0.77;

/** Near-miss band below the criterion threshold; surfaced as “suspicious” in the report. */
export const RUBRIC_SUSPICIOUS_THRESHOLD_OFFSET = 0.12;

/** Stricter floor for short rubric terms (length ≤5) to reduce accidental fuzzy matches. */
export const SHORT_WORD_STRICT_THRESHOLD = 0.9;

export const VERY_SHORT_WORD_EXACT_MATCH_LENGTH = 3;

export const SPELLCHECK_MIN_WORD_LENGTH = 4;

export const SPELLCHECK_SUGGESTION_LIMIT = 3;

export const SPELLCHECK_SUGGESTION_THRESHOLD = 0.74;

export const CODING_TEST_TIMEOUT_MS = 600;

export const REPORT_FORM_URL = "https://forms.google.com/your-revision-feedback-form";

export const FLASHCARD_BOX_INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

export const APP_TITLE = "T-Level Digital Sprint";
