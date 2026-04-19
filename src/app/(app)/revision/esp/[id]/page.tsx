import { notFound, redirect } from "next/navigation";
import { DEFAULT_ESP_SCENARIO_ID, getEspScenario } from "@/data/esp/scenarios";

const TASK_SLUGS = new Set(["pre-release", "task-1", "task-2", "task-3", "task-4a", "task-4b"]);

/**
 * Single-segment URLs: /revision/esp/task-1 → default scenario + stage.
 * Or /revision/esp/{scenarioId} → first stage of that scenario.
 */
export default async function EspSingleSegmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (TASK_SLUGS.has(id)) {
    redirect(`/revision/esp/${DEFAULT_ESP_SCENARIO_ID}/${id}`);
  }

  if (getEspScenario(id)) {
    redirect(`/revision/esp/${id}/pre-release`);
  }

  notFound();
}
