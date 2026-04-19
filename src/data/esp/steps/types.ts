import type { SceneBeat, SceneDescriptor } from "@/components/features/revision/esp/scene-engine/types";

/** Shared lesson-step shape for ESP tasks (pre-release + tasks 2..4b). */
export interface EspGenericLessonStep {
  id: string;
  number: number;
  label: string;
  emoji: string;
  duration: string;
  /** Auto-advance hint duration for the step timer bar. */
  durationMs: number;
  headline: string;
  lead: string;
  keyPoints: string[];
  weak?: { label: string; example: string };
  strong?: { label: string; example: string };
  takeaway: string;
  /** Registered scene component id + optional data. */
  scene: SceneDescriptor;
  /** Ordered beats that drive the scene's timeline + captions. */
  beats: SceneBeat[];
}
