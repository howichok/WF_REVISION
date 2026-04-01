import type { NormalizedText } from "./types";

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bcan't\b/g, "cannot"],
  [/\bwon't\b/g, "will not"],
  [/\bn't\b/g, " not"],
  [/\bit's\b/g, "it is"],
  [/\bthat's\b/g, "that is"],
  [/\bthere's\b/g, "there is"],
  [/\bthey're\b/g, "they are"],
  [/\bwe're\b/g, "we are"],
  [/\byou're\b/g, "you are"],
];

const SPELLING_NORMALIZATIONS: Array<[RegExp, string]> = [
  [/\bunauthorised\b/g, "unauthorized"],
  [/\bauthorised\b/g, "authorized"],
  [/\bauthorisation\b/g, "authorization"],
  [/\borganisation\b/g, "organization"],
  [/\borganisations\b/g, "organizations"],
  [/\bbehaviour\b/g, "behavior"],
  [/\bcolour\b/g, "color"],
  [/\bcentre\b/g, "center"],
  [/\bcentres\b/g, "centers"],
  [/\blicence\b/g, "license"],
  [/\banalyse\b/g, "analyze"],
  [/\banalysed\b/g, "analyzed"],
  [/\banalysing\b/g, "analyzing"],
  [/\bprioritise\b/g, "prioritize"],
  [/\bprioritised\b/g, "prioritized"],
  [/\bprioritising\b/g, "prioritizing"],
  [/\boptimise\b/g, "optimize"],
  [/\boptimised\b/g, "optimized"],
  [/\boptimising\b/g, "optimizing"],
];

function normalizeToken(token: string): string {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("ing") && token.length > 5) {
    return token.slice(0, -3);
  }

  if (token.endsWith("ed") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("es") && token.length > 4 && !token.endsWith("ses")) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 4 && !/(ss|us|is)$/.test(token)) {
    return token.slice(0, -1);
  }

  return token;
}

export function normalizeString(input: string): string {
  let normalized = input.toLowerCase().normalize("NFKD");

  for (const [pattern, replacement] of CONTRACTIONS) {
    normalized = normalized.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of SPELLING_NORMALIZATIONS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeNormalized(normalized: string): string[] {
  return normalized ? normalized.split(" ").map(normalizeToken) : [];
}

export function normalizeText(input: string): NormalizedText {
  const normalized = normalizeString(input);

  return {
    original: input,
    normalized,
    tokens: tokenizeNormalized(normalized),
  };
}
