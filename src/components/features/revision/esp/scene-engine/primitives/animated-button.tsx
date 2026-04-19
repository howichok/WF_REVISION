"use client";

import { forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps {
  label: string;
  icon?: ReactNode;
  state?: "idle" | "hover" | "active" | "disabled";
  tone?: "primary" | "neutral" | "success";
  size?: "sm" | "md";
  className?: string;
}

export const AnimatedButton = forwardRef<HTMLDivElement, AnimatedButtonProps>(function AnimatedButton(
  { label, icon, state = "idle", tone = "primary", size = "md", className },
  ref
) {
  const toneClass =
    tone === "primary"
      ? "bg-accent text-white"
      : tone === "success"
        ? "bg-[#15803d] text-white"
        : "border border-border/60 bg-card text-foreground";

  return (
    <motion.div
      ref={ref}
      animate={{
        y: state === "active" ? 1 : state === "hover" ? -1 : 0,
        scale: state === "active" ? 0.97 : 1,
        opacity: state === "disabled" ? 0.55 : 1,
        boxShadow:
          state === "hover"
            ? "0 10px 24px -12px rgba(103,92,241,0.55)"
            : "0 4px 10px -6px rgba(15,23,42,0.2)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-lg font-semibold",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-2 text-[12px]",
        toneClass,
        className
      )}
    >
      {icon}
      {label}
    </motion.div>
  );
});
