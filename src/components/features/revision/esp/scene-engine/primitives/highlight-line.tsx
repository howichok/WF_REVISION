"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type LineState = "dim" | "scanning" | "highlighted" | "tagged" | "taken" | "skipped";

interface HighlightLineProps {
  text: string;
  state: LineState;
  tagLabel?: string;
  color?: string; // hex / rgb
  layoutId?: string;
  className?: string;
}

/** A sentence row inside a DocumentBlock that can be scanned, highlighted, tagged, or "taken". */
export const HighlightLine = forwardRef<HTMLDivElement, HighlightLineProps>(function HighlightLine(
  { text, state, tagLabel, color, layoutId, className },
  ref
) {
  const isActive = state === "highlighted" || state === "tagged" || state === "scanning";
  const isTaken = state === "taken";
  const isSkipped = state === "skipped";

  const underlineColor = color ?? "var(--color-accent)";

  return (
    <motion.div
      ref={ref}
      layoutId={layoutId}
      initial={false}
      animate={{
        opacity: isTaken ? 0.28 : state === "dim" ? 0.52 : 1,
        scale: state === "scanning" ? 1.01 : 1,
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative flex items-start gap-2 rounded-md px-2 py-1.5 text-[13px] leading-relaxed",
        isActive && !isTaken && "bg-white/60 shadow-sm dark:bg-white/5",
        isSkipped && "opacity-60",
        className
      )}
    >
      {tagLabel && state !== "dim" && state !== "scanning" ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.7, x: -4 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: color ?? "var(--color-accent)" }}
        >
          {tagLabel}
        </motion.span>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-foreground/90">{text}</p>
        {/* Sweep underline */}
        <motion.span
          aria-hidden
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: isActive ? 1 : 0,
            opacity: isActive ? 0.85 : 0,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-0.5 block h-0.5 origin-left rounded"
          style={{ backgroundColor: underlineColor }}
        />
      </div>

      {isSkipped ? (
        <span className="ml-1 shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          Skip
        </span>
      ) : null}
    </motion.div>
  );
});
