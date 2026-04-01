import { matchPhraseGroupInNormalizedText } from "@/lib/marking/phrase-match";
import type {
  ConceptEvaluation,
  MisconceptionEvaluation,
  NormalizedText,
  PhraseGroupRule,
  RevisionConceptRule,
  RevisionMisconceptionRule,
} from "./types";

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function describeGroup(group: PhraseGroupRule): string {
  return group.anyOf.slice(0, 2).join(" / ");
}

export function evaluateConcept(
  text: NormalizedText,
  rule: RevisionConceptRule
): ConceptEvaluation {
  const matchedEvidence: string[] = [];
  const missingEvidence: string[] = [];
  let matchedGroups = 0;

  for (const group of rule.requiredGroups) {
    const hit = matchPhraseGroupInNormalizedText(text, group);

    if (hit) {
      matchedGroups += 1;
      matchedEvidence.push(hit.cue);
      continue;
    }

    missingEvidence.push(describeGroup(group));
  }

  const coverage = rule.requiredGroups.length
    ? matchedGroups / rule.requiredGroups.length
    : 0;
  const scoreAwarded = roundToHalf(rule.weight * coverage);

  return {
    id: rule.id,
    label: rule.label,
    scoreAwarded,
    maxScore: rule.weight,
    coverage,
    matchedEvidence,
    missingEvidence,
  };
}

export function evaluateMisconception(
  text: NormalizedText,
  rule: RevisionMisconceptionRule
): MisconceptionEvaluation | null {
  for (const group of rule.groups) {
    const hit = matchPhraseGroupInNormalizedText(text, group);
    if (!hit) {
      continue;
    }

    return {
      id: rule.id,
      label: rule.label,
      explanation: rule.explanation,
      penaltyApplied: rule.penalty,
    };
  }

  return null;
}
