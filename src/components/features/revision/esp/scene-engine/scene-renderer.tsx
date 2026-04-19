"use client";

import { useMemo } from "react";
import type { EspScenario } from "@/data/esp/scenarios/types";
import type { SceneBeat, SceneDescriptor } from "./types";
import { SceneStage } from "./scene-stage";
import { getScene } from "./registry";
import "./scenes/register-scenes";

interface SceneRendererProps {
  scenario: EspScenario;
  scene: SceneDescriptor | undefined;
  /** Changing value restarts the timeline (used by a parent Replay button). */
  replayKey?: number | string;
  /** Beats drive captions + timing. Scenes read them via the stage context. */
  beats: SceneBeat[];
  label?: string;
  minStageHeightClass?: string;
}

export function SceneRenderer({
  scenario,
  scene,
  replayKey = 0,
  beats,
  label,
  minStageHeightClass,
}: SceneRendererProps) {
  const Component = useMemo(() => (scene ? getScene(scene.id) : undefined), [scene]);

  if (!scene || !Component) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
        No scene registered for {scene?.id ?? "unknown"}.
      </div>
    );
  }

  return (
    <SceneStage
      label={label}
      beats={beats}
      resetKey={replayKey}
      minStageHeightClass={minStageHeightClass}
    >
      <Component scenario={scenario} data={scene.data} />
    </SceneStage>
  );
}
