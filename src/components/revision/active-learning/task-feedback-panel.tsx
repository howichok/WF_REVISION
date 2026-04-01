"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type FeedbackTone = "default" | "success" | "warning" | "danger" | "analysis";

interface TaskFeedbackPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  summary?: ReactNode;
  tone?: FeedbackTone;
}

const toneClasses: Record<FeedbackTone, string> = {
  default: "al-feedback-panel",
  analysis: "al-feedback-panel",
  success: "al-feedback-panel al-feedback-success",
  warning: "al-feedback-panel al-feedback-warning",
  danger: "al-feedback-panel al-feedback-danger",
};

export function TaskFeedbackPanel({
  className,
  title,
  summary,
  tone = "default",
  children,
  ...props
}: TaskFeedbackPanelProps) {
  return (
    <section className={cn(toneClasses[tone], className)} {...props}>
      {title || summary ? (
        <header className="space-y-2">
          {title ? <h3 className="text-lg font-semibold text-foreground">{title}</h3> : null}
          {summary ? <p className="text-sm leading-6 text-muted">{summary}</p> : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}

export type { TaskFeedbackPanelProps, FeedbackTone };
