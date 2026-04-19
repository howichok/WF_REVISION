"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskResponsePanelProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  description?: ReactNode;
}

export function TaskResponsePanel({
  className,
  label,
  description,
  children,
  ...props
}: TaskResponsePanelProps) {
  return (
    <section className={cn("al-response-panel", className)} {...props}>
      <motion.div
        className="contents"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30, delay: 0.04 }}
      >
        {label || description ? (
          <header className="space-y-1.5">
            {label ? <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">{label}</h3> : null}
            {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
          </header>
        ) : null}

        {children}
      </motion.div>
    </section>
  );
}

export type { TaskResponsePanelProps };
