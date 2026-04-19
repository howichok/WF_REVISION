"use client";

import { BriefTriageScene } from "../brief-triage-scene";
import type { SceneProps } from "../../registry";

/**
 * Task 1 brief-highlight — same mechanics as the pre-release triage. Task 1's
 * brief reading reinforces the same pedagogy with the same scenario content.
 */
export function BriefHighlightScene(props: SceneProps) {
  return <BriefTriageScene {...props} />;
}
