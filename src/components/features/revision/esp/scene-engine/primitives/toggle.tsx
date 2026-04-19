"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Toggle({
  on,
  label,
  className,
}: {
  on: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <motion.span
        animate={{ backgroundColor: on ? "var(--color-success)" : "rgba(127,127,127,0.3)" }}
        className="relative inline-flex h-4 w-7 items-center rounded-full p-0.5"
      >
        <motion.span
          layout
          animate={{ x: on ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 24 }}
          className="inline-block size-3 rounded-full bg-white shadow"
        />
      </motion.span>
      {label ? <span className="text-[11px] font-medium text-muted-foreground">{label}</span> : null}
    </span>
  );
}
