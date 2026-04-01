const NEGATION_TOKENS = new Set([
  "no",
  "not",
  "never",
  "without",
  "cannot",
  "neither",
  "nor",
  "hardly",
  "rarely",
]);

const CORRECTIVE_TOKENS = new Set([
  "wrong",
  "incorrect",
  "false",
  "myth",
  "misconception",
  "avoid",
]);

const CLAUSE_BOUNDARY_TOKENS = new Set([
  "and",
  "but",
  "because",
  "so",
  "then",
  "also",
  "therefore",
]);

export function isNegated(tokens: string[], start: number, end: number): boolean {
  const lookBehindStart = Math.max(0, start - 3);
  const lookAheadEnd = Math.min(tokens.length - 1, end + 2);

  for (let index = start - 1; index >= lookBehindStart; index -= 1) {
    if (CLAUSE_BOUNDARY_TOKENS.has(tokens[index])) {
      break;
    }

    if (NEGATION_TOKENS.has(tokens[index]) || CORRECTIVE_TOKENS.has(tokens[index])) {
      return true;
    }
  }

  for (let index = end + 1; index <= lookAheadEnd; index += 1) {
    if (CLAUSE_BOUNDARY_TOKENS.has(tokens[index])) {
      break;
    }

    if (NEGATION_TOKENS.has(tokens[index])) {
      return true;
    }
  }

  return false;
}
