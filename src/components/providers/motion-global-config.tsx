"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/**
 * Product choice: always run Framer Motion animations regardless of
 * `prefers-reduced-motion` so revision / exam UI feels consistent.
 * CSS overrides for reduced motion in `globals.css` were removed for the same reason.
 */
export function MotionGlobalConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
