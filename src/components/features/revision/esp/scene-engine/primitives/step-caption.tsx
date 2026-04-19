"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Small caption overlay anchored to the stage. Scenes use this sparingly — the
 * main caption lives in the SceneStage footer. This is only for inline
 * callouts tied to a specific object (e.g. "step 2 of 7").
 */
export function StepCaption({
  visible,
  children,
  tone = "neutral",
  className,
}: {
  visible: boolean;
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "danger";
  className?: string;
}) {
  const toneMap = {
    neutral: "bg-card text-foreground border-border/60",
    accent: "bg-accent/15 text-accent border-accent/40",
    success: "bg-success/15 text-success border-success/40",
    danger: "bg-danger/15 text-danger border-danger/40",
  } as const;
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className={cn(
            "pointer-events-none inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm",
            toneMap[tone],
            className
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
