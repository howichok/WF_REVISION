import { isNegated } from "@/lib/intelligence/context";
import {
  findPhraseEvidence,
  stringSimilarity,
  tokenOverlapScore,
} from "@/lib/intelligence/fuzzy";
import type { NormalizedText } from "@/lib/intelligence/types";
import { normalizeText } from "@/lib/intelligence/normalize";
import {
  PHRASE_TOKEN_OVERLAP_MIN,
  TOKEN_SUBSET_SIMILARITY,
} from "@/lib/marking/thresholds";

export type PhraseGroupLike = { anyOf: string[] };

function normalizeBritishAndAmericanSpelling(phrase: string) {
  return phrase
    .replace(/\bauthori[sz](ed|ation|e|ing)\b/g, (match) =>
      match.replace("s", "z")
    )
    .replace(/\bunauthori[sz](ed|ation|e|ing)\b/g, (match) =>
      match.replace("s", "z")
    );
}

function hasTokenSubset(textTokens: string[], candidateTokens: string[]) {
  return candidateTokens.every((token) => textTokens.includes(token));
}

/**
 * Best fuzzy match for a single expected phrase against one normalized text scope
 * (a segment or the whole answer). Used by rubric slots and concept rules.
 */
export function matchCandidateInNormalizedText(
  scope: NormalizedText,
  candidate: string
): { cue: string; similarity: number } | null {
  const normalizedCandidate = normalizeText(
    normalizeBritishAndAmericanSpelling(candidate)
  );

  if (!normalizedCandidate.normalized) {
    return null;
  }

  const phraseEvidence = findPhraseEvidence(scope, normalizedCandidate.normalized);
  if (
    phraseEvidence &&
    !isNegated(scope.tokens, phraseEvidence.start, phraseEvidence.end)
  ) {
    return {
      cue: candidate,
      similarity: phraseEvidence.similarity,
    };
  }

  if (hasTokenSubset(scope.tokens, normalizedCandidate.tokens)) {
    return {
      cue: candidate,
      similarity: TOKEN_SUBSET_SIMILARITY,
    };
  }

  const overlap = tokenOverlapScore(scope.tokens, normalizedCandidate.tokens);
  if (normalizedCandidate.tokens.length >= 2 && overlap >= PHRASE_TOKEN_OVERLAP_MIN) {
    return {
      cue: candidate,
      similarity: overlap,
    };
  }

  const segmentSimilarity = stringSimilarity(
    scope.normalized,
    normalizedCandidate.normalized
  );
  if (segmentSimilarity >= 0.9) {
    return {
      cue: candidate,
      similarity: segmentSimilarity,
    };
  }

  return null;
}

export function matchPhraseGroupInNormalizedText(
  text: NormalizedText,
  group: PhraseGroupLike
): { cue: string; similarity: number } | null {
  let best: { cue: string; similarity: number } | null = null;

  for (const candidate of group.anyOf) {
    const hit = matchCandidateInNormalizedText(text, candidate);
    if (!hit) {
      continue;
    }
    if (!best || hit.similarity > best.similarity) {
      best = hit;
    }
  }

  return best;
}

export function matchPhraseGroupInSegments(
  segments: NormalizedText[],
  group: PhraseGroupLike
): { cue: string; similarity: number } | null {
  let best: { cue: string; similarity: number } | null = null;

  for (const candidate of group.anyOf) {
    for (const segment of segments) {
      const hit = matchCandidateInNormalizedText(segment, candidate);
      if (!hit) {
        continue;
      }
      if (!best || hit.similarity > best.similarity) {
        best = hit;
      }
    }
  }

  return best;
}
