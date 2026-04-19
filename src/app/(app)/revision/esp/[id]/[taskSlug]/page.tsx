import { notFound } from "next/navigation";
import { EspScenarioStagePage } from "@/components/features/revision/esp/esp-scenario-stage-page";
import { ESP_SLUG_TO_TASK } from "@/data/esp/scenarios/types";
import type { EspStageSlug } from "@/data/esp/scenarios/types";
import { getEspScenario } from "@/data/esp/scenarios";

export default async function EspScenarioTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskSlug: string }>;
}) {
  const { id, taskSlug } = await params;
  const task = ESP_SLUG_TO_TASK[taskSlug as EspStageSlug];
  if (!task || !getEspScenario(id)) {
    notFound();
  }
  return <EspScenarioStagePage scenarioId={id} taskId={task} />;
}
