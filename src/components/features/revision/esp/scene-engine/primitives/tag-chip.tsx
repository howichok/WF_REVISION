"use client";

import { forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagChipProps {
  label: string;
  color?: string;
  icon?: ReactNode;
  layoutId?: string;
  tone?: "solid" | "soft";
  size?: "sm" | "md";
  className?: string;
}

/** Colored pill — used both as an in-document tag and as a bucket chip. */
export const TagChip = forwardRef<HTMLSpanElement, TagChipProps>(function TagChip(
  { label, color, icon, layoutId, tone = "soft", size = "sm", className },
  ref
) {
  const bg = color ?? "var(--color-accent)";
  return (
    <motion.span
      ref={ref}
      layoutId={layoutId}
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-semibold uppercase tracking-wider",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
        tone === "solid" ? "text-white" : "border",
        className
      )}
      style={
        tone === "solid"
          ? { backgroundColor: bg }
          : { backgroundColor: `${bg}1A`, borderColor: `${bg}55`, color: bg }
      }
    >
      {icon}
      {label}
    </motion.span>
  );
});
