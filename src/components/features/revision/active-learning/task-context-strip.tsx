"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskContextStripProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: ReactNode;
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  status?: ReactNode;
}

export function TaskContextStrip({
  className,
  eyebrow,
  breadcrumb,
  meta,
  status,
  children,
  ...props
}: TaskContextStripProps) {
  return (
    <div className={cn("al-context-strip", className)} {...props}>
      <motion.div
        className="contents"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      >
        {eyebrow ? <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{eyebrow}</div> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            {breadcrumb ? <div className="truncate text-sm text-foreground">{breadcrumb}</div> : null}
            {meta ? <div className="text-sm leading-6 text-muted">{meta}</div> : null}
          </div>

          {status ? <div className="shrink-0 text-sm text-foreground">{status}</div> : null}
        </div>

        {children}
      </motion.div>
    </div>
  );
}

export type { TaskContextStripProps };
