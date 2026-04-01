"use client";

import type { HTMLAttributes, ReactNode } from "react";
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
      {label || description ? (
        <header className="space-y-1.5">
          {label ? <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/90">{label}</h3> : null}
          {description ? <p className="text-sm leading-6 text-muted">{description}</p> : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}

export type { TaskResponsePanelProps };
