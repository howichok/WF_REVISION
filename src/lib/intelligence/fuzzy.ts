import { normalizeString, tokenizeNormalized } from "./normalize";
import type { NormalizedText, PhraseEvidence } from "./types";

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1).fill(0);

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;

    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + substitutionCost
      );
    }

    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column];
    }
  }

  return current[right.length];
}

export function stringSimilarity(left: string, right: string): number {
  if (!left && !right) {
    return 1;
  }

  if (!left || !right) {
    return 0;
  }

  const longest = Math.max(left.length, right.length);
  if (!longest) {
    return 1;
  }

  return 1 - levenshteinDistance(left, right) / longest;
}

export function tokenOverlapScore(leftTokens: string[], rightTokens: string[]): number {
  if (!leftTokens.length || !rightTokens.length) {
    return 0;
  }

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let shared = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.max(leftSet.size, rightSet.size);
}

function phraseWindowSimilarity(windowTokens: string[], phraseTokens: string[]): number {
  const windowString = windowTokens.join(" ");
  const phraseString = phraseTokens.join(" ");
  const charSimilarity = stringSimilarity(windowString, phraseString);
  const tokenSimilarity = tokenOverlapScore(windowTokens, phraseTokens);

  return Math.max(charSimilarity, (charSimilarity + tokenSimilarity) / 2);
}

export function findPhraseEvidence(
  text: NormalizedText,
  phrase: string
): PhraseEvidence | null {
  const normalizedPhrase = normalizeString(phrase);
  const phraseTokens = tokenizeNormalized(normalizedPhrase);

  if (!phraseTokens.length || !text.tokens.length) {
    return null;
  }

  const minWindow = Math.max(1, phraseTokens.length - 1);
  const maxWindow = Math.min(text.tokens.length, phraseTokens.length + 2);
  const threshold = phraseTokens.length === 1 ? 0.84 : 0.78;
  let bestMatch: PhraseEvidence | null = null;

  for (let start = 0; start < text.tokens.length; start += 1) {
    for (let windowLength = minWindow; windowLength <= maxWindow; windowLength += 1) {
      const endExclusive = start + windowLength;
      if (endExclusive > text.tokens.length) {
        continue;
      }

      const windowTokens = text.tokens.slice(start, endExclusive);
      const similarity = phraseWindowSimilarity(windowTokens, phraseTokens);

      if (similarity < threshold) {
        continue;
      }

      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          phrase,
          start,
          end: endExclusive - 1,
          similarity,
          negated: false,
        };
      }
    }
  }

  return bestMatch;
}
