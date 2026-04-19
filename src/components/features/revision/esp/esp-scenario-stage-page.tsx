"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { EspTask } from "@/data/curriculum";
import { getEspScenario } from "@/data/esp/scenarios";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/features/revision/revision-subnav";
import { EspStageShell } from "@/components/features/revision/esp/esp-stage-shell";
import { useEspSessionStore } from "@/store/esp-session-store";
import { Task1LessonPage } from "@/components/features/revision/esp/task1/task1-lesson-page";
import { TaskLessonPage } from "@/components/features/revision/esp/task-lesson-page";
import { Button } from "@/components/ui";
import { EspScenarioIntroWizard } from "@/components/features/revision/esp/esp-scenario-intro-wizard";
import { ESP_TASK_SLUGS } from "@/components/features/revision/esp/esp-task-meta";

export function EspScenarioStagePage({ scenarioId, taskId }: { scenarioId: string; taskId: EspTask }) {
  const scenario = getEspScenario(scenarioId);
  const hydrateFromScenario = useEspSessionStore((s) => s.hydrateFromScenario);
  const resetScenario = useEspSessionStore((s) => s.resetScenario);

  useEffect(() => {
    hydrateFromScenario(scenarioId);
  }, [scenarioId, hydrateFromScenario]);

  if (!scenario) {
    return (
      <PageContainer size="lg" className="py-10">
        <p className="text-sm text-muted-foreground">Scenario not found.</p>
      </PageContainer>
    );
  }

  const slug = ESP_TASK_SLUGS[taskId];

  return (
    <PageContainer size="full" className="py-6 sm:py-8">
      <div className="space-y-5">
        <RevisionSubnav activeRoute="esp" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
          <Link
            href="/revision/esp"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            ESP hub
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <EspScenarioIntroWizard scenario={scenario} currentTaskSlug={slug} />
            <Button type="button" variant="outline" size="sm" onClick={() => resetScenario(scenarioId)}>
              Reset scenario
            </Button>
          </div>
        </div>

        <EspStageShell scenario={scenario} taskId={taskId}>
          {taskId === "task_1" ? (
            <Task1LessonPage scenario={scenario} />
          ) : (
            <TaskLessonPage scenario={scenario} taskId={taskId as Exclude<EspTask, "task_1">} />
          )}
        </EspStageShell>
      </div>
    </PageContainer>
  );
}
