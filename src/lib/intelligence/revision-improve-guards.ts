import type { RevisionImprovementChange } from "./types";

const INSERTED_CUE_PATTERN = /\s*\[(?:upgrade cue|add cue|fix cue): [^\]\n]+\]/g;

export function isSafeMicroRewrite(value: string, targetText?: string) {
  const cleaned = value.trim();
  if (!cleaned || !targetText) {
    return false;
  }

  if (cleaned.length > 36) {
    return false;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 5) {
    return false;
  }

  if (/[.!?;:\n]/.test(cleaned)) {
    return false;
  }

  return cleaned.toLowerCase() !== targetText.trim().toLowerCase();
}

export function canAcceptMicroRewrite(change: RevisionImprovementChange) {
  return Boolean(
    change.kind === "replace" &&
      change.targetText &&
      change.microRewriteText &&
      isSafeMicroRewrite(change.microRewriteText, change.targetText)
  );
}

export function stripInsertedCueTokens(answer: string) {
  return answer
    .replace(INSERTED_CUE_PATTERN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function countInsertedCueTokens(answer: string) {
  return answer.match(INSERTED_CUE_PATTERN)?.length ?? 0;
}
