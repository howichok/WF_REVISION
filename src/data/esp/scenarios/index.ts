export type { EspBriefSegment, EspScenario, EspScenarioRole, EspStageSlug, EspTestCaseRow, BriefSegmentCategory } from "./types";
export { ESP_SLUG_TO_TASK, ESP_STAGE_ORDER, ESP_TASK_TO_SLUG } from "./types";

import { animalRescueScenario } from "./animal-rescue";
import { carSalesScenario } from "./car-sales";
import { canteenScenario } from "./canteen";
import { clinicScenario } from "./clinic";
import { gymScenario } from "./gym";
import type { EspScenario } from "./types";

export const ESP_SCENARIOS: EspScenario[] = [
  carSalesScenario,
  animalRescueScenario,
  gymScenario,
  canteenScenario,
  clinicScenario,
];

export const DEFAULT_ESP_SCENARIO_ID = "car-sales";

const BY_ID: Record<string, EspScenario> = Object.fromEntries(ESP_SCENARIOS.map((s) => [s.id, s]));

export function getEspScenario(id: string): EspScenario | undefined {
  return BY_ID[id];
}

export function listEspScenarioSummaries(): { id: string; title: string; context: string }[] {
  return ESP_SCENARIOS.map((s) => ({
    id: s.id,
    title: s.title,
    context: s.vocationalContext,
  }));
}
