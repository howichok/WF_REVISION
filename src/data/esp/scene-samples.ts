import type { BriefSegmentCategory, EspBriefSegment, EspScenario } from "./scenarios/types";

/**
 * Generic, scenario-agnostic brief sentences. Used as a fallback when the real
 * scenario does not have a sentence for a given category.
 */
const SAMPLE: Record<BriefSegmentCategory, string> = {
  aim: "Client wants a small web tool live in six working weeks.",
  constraint: "The team has one tester who is only available three days a week.",
  file: "A starter CSV and a Python template are provided in the pack.",
  risk: "The CSV may contain missing or malformed rows.",
  user: "Reception staff need large buttons and obvious error text.",
  neutral: "The project sits in the team's existing reporting workflow.",
};

/** Display label for each category — consumed by scenes. */
export const CATEGORY_LABEL: Record<BriefSegmentCategory, string> = {
  aim: "Aim",
  constraint: "Constraints",
  file: "Assets",
  risk: "Risks",
  user: "Users",
  neutral: "Context",
};

/** Brand colour for each bucket/tag. */
export const CATEGORY_COLOR: Record<BriefSegmentCategory, string> = {
  aim: "#2563eb",
  constraint: "#ea580c",
  file: "#16a34a",
  risk: "#dc2626",
  user: "#9333ea",
  neutral: "#64748b",
};

export interface SceneSegment {
  id: string;
  text: string;
  category: BriefSegmentCategory;
  /** True when pulled from the scenario, false when filled from SAMPLE. */
  fromScenario: boolean;
}

/**
 * Returns one sentence per requested category. Prefers scenario content; falls
 * back to the neutral sample when the category is missing. Preserves the order
 * of `needed`.
 */
export function pickSegmentsForScene(
  scenario: EspScenario,
  needed: BriefSegmentCategory[]
): SceneSegment[] {
  const byCategory = new Map<BriefSegmentCategory, EspBriefSegment[]>();
  for (const s of scenario.briefSegments) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }
  return needed.map((cat, idx) => {
    const real = byCategory.get(cat)?.[0];
    if (real) {
      return { id: real.id, text: real.text, category: cat, fromScenario: true };
    }
    return {
      id: `sample-${cat}-${idx}`,
      text: SAMPLE[cat],
      category: cat,
      fromScenario: false,
    };
  });
}
