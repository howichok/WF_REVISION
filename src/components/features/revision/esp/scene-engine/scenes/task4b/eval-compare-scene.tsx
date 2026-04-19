"use client";

import { RationaleCompareScene } from "../task1/rationale-compare-scene";
import type { SceneProps } from "../../registry";

/**
 * Same mechanics as Task 1's rationale comparison — weak evaluation text vs
 * strong. Reused since the pedagogy is identical (describe vs justify).
 */
export function EvalCompareScene(props: SceneProps) {
  return <RationaleCompareScene {...props} />;
}
