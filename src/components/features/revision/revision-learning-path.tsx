"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui";
import { REVISION_LEARNING_PATH_STEPS } from "@/lib/revision-learning-path";

export function RevisionLearningPath() {
  return (
    <Card variant="navigation" className="p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Suggested learning path
      </p>
      <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">
        Move from diagnosis to confident exam-style answers
      </h2>
      <ol className="mt-5 space-y-4">
        {REVISION_LEARNING_PATH_STEPS.map((step, index) => (
          <li key={step.href} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={step.href}
                className="group inline-flex items-center gap-1 font-semibold text-foreground hover:text-accent"
              >
                {step.title}
                <ArrowRight
                  size={14}
                  className="opacity-60 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
